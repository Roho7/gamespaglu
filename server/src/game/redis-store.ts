import { randomUUID } from "node:crypto";
import { ROOM_TTL_MS, type RoomCode } from "../../../shared/protocol";
import type { RoomRedis } from "../redis";
import { reject } from "./errors";
import type { RoomRecord } from "./room";
import type { IndexedMutation, Mutation, RoomStore, RoundIndex } from "./store";

const ROOM_PREFIX = "gp:room:";
const LOCK_PREFIX = "gp:lock:";
const DUE_KEY = "gp:due";

const LOCK_TTL_MS = 5_000;
const LOCK_ATTEMPTS = 150;
const LOCK_WAIT_MS = 40;

type Saved = { room: RoomRecord; deadlineAt: number | null };

const roomKey = (code: string) => ROOM_PREFIX + code;
const lockKey = (code: string) => LOCK_PREFIX + code;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export class RedisRoomStore implements RoomStore {
  private readonly queues = new Map<RoomCode, Promise<unknown>>();

  constructor(
    private readonly redis: RoomRedis,
    private readonly now: () => number = Date.now,
  ) { }

  async insert(room: RoomRecord, index: RoundIndex): Promise<boolean> {
    const wrote = await this.write(room, index.deadlineAt, true);
    return wrote;
  }

  update<T>(code: RoomCode, fn: (room: RoomRecord) => IndexedMutation<T>): Promise<Mutation<T>> {
    const run = async (): Promise<Mutation<T>> => {
      const token = randomUUID();
      await this.acquire(code, token);
      try {
        const saved =
          (await this.redis.get<Saved>(roomKey(code))) ??
          reject("ROOM_NOT_FOUND", "No room with that code.");
        const { room, result, index } = fn(structuredClone(saved.room));
        if (room) await this.write(room, index.deadlineAt, false);
        else await this.remove(code);
        return { room, result };
      } finally {
        await this.redis.compareAndDel(lockKey(code), token);
      }
    };
    const queued = (this.queues.get(code) ?? Promise.resolve()).then(run, run);
    this.queues.set(code, queued.catch(() => undefined));
    return queued;
  }

  async due(now: number): Promise<RoomCode[]> {
    const codes = await this.redis.zRangeByScore(DUE_KEY, now);
    const live: RoomCode[] = [];
    for (const code of codes) {
      if (await this.redis.exists(roomKey(code))) live.push(code as RoomCode);
      else await this.redis.zRem(DUE_KEY, code);
    }
    return live;
  }

  /**
   * Rooms expire on their own key. This stays on the interface because the sweep still calls it.
   * It returns 0. A deadline whose room is already gone is removed by `due`.
   */
  async reap(_before: number): Promise<number> {
    return 0;
  }

  private async write(room: RoomRecord, deadlineAt: number | null, nx: boolean): Promise<boolean> {
    const ttl = room.lastActiveAt + ROOM_TTL_MS - this.now();
    if (ttl <= 0) {
      await this.remove(room.code);
      return false;
    }
    const saved: Saved = { room: structuredClone(room), deadlineAt };
    const wrote = await this.redis.set(roomKey(room.code), saved, { nx, px: ttl });
    if (!wrote) return false;
    await this.syncDue(room.code, deadlineAt);
    return true;
  }

  private async remove(code: string) {
    await this.redis.del(roomKey(code));
    await this.redis.zRem(DUE_KEY, code);
  }

  private async syncDue(code: string, deadlineAt: number | null) {
    if (deadlineAt === null) await this.redis.zRem(DUE_KEY, code);
    else await this.redis.zAdd(DUE_KEY, deadlineAt, code);
  }

  private async acquire(code: string, token: string) {
    const key = lockKey(code);
    for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt++) {
      const got = await this.redis.set(key, token, { nx: true, px: LOCK_TTL_MS });
      if (got) return;
      await sleep(LOCK_WAIT_MS);
    }
    throw new Error(`Could not lock room ${code}.`);
  }
}
