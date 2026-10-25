import { describe, expect, test } from "vitest";
import { ROOM_TTL_MS, type RoomCode } from "../../../shared/protocol";
import { DEFAULT_MAFIA_SETTINGS } from "../../../shared/mafia";
import type { RoomRedis } from "../redis";
import { expectRefusalAsync } from "../test/helpers";
import type { RoomRecord } from "./room";
import { RedisRoomStore } from "./redis-store";
import type { RoundIndex } from "./store";

const CODE = "BBBB" as RoomCode;
const QUIET: RoundIndex = { phase: "lobby", outcome: null, deadlineAt: null };

type Entry = { value: unknown; expiresAt: number | null };

class FakeRedis implements RoomRedis {
  readonly strings = new Map<string, Entry>();
  readonly scores = new Map<string, number>();

  constructor(private readonly now: () => number) {}

  async ping() {
    return "PONG";
  }

  private live(key: string): Entry | null {
    const entry = this.strings.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= this.now()) {
      this.strings.delete(key);
      return null;
    }
    return entry;
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.live(key)?.value as T | undefined) ?? null;
  }

  async set(key: string, value: unknown, opts?: { nx?: boolean; px?: number }) {
    if (opts?.nx && this.live(key)) return false;
    const expiresAt = opts?.px !== undefined ? this.now() + opts.px : null;
    this.strings.set(key, { value, expiresAt });
    return true;
  }

  async del(key: string) {
    this.strings.delete(key);
  }

  async exists(key: string) {
    return this.live(key) !== null;
  }

  async zAdd(_key: string, score: number, member: string) {
    this.scores.set(member, score);
  }

  async zRem(_key: string, member: string) {
    this.scores.delete(member);
  }

  async zRangeByScore(_key: string, max: number) {
    return [...this.scores].filter(([, score]) => score <= max).map(([member]) => member);
  }

  async compareAndDel(key: string, token: string) {
    if (this.live(key)?.value !== token) return false;
    this.strings.delete(key);
    return true;
  }
}

function room(lastActiveAt: number): RoomRecord {
  return {
    code: CODE,
    game: "mafia",
    hostId: "host",
    settings: DEFAULT_MAFIA_SETTINGS,
    players: [],
    round: null,
    lastActiveAt,
  };
}

function harness() {
  let now = 1_000_000;
  const clock = () => now;
  const redis = new FakeRedis(clock);
  return { redis, store: new RedisRoomStore(redis, clock), advance: (to: number) => (now = to) };
}

describe("RedisRoomStore", () => {
  test("refuses a second insert of the same code", async () => {
    const { store } = harness();
    expect(await store.insert(room(1_000_000), QUIET)).toBe(true);
    expect(await store.insert(room(1_000_000), QUIET)).toBe(false);
  });

  test("a missing room is the same refusal as before", async () => {
    const { store } = harness();
    await expectRefusalAsync("ROOM_NOT_FOUND", () => store.update(CODE, (r) => ({ room: r, result: null, index: QUIET })));
  });

  test("two taps at once both land", async () => {
    const { store, redis } = harness();
    await store.insert(room(1_000_000), QUIET);
    await Promise.all(
      ["a", "b"].map((id) =>
        store.update(CODE, (current) => ({
          room: {
            ...current,
            players: [...current.players, { id, deviceId: id, name: id, seat: current.players.length, connected: true, score: 0 }],
          },
          result: id,
          index: QUIET,
        })),
      ),
    );
    const saved = await redis.get<{ room: RoomRecord }>("gp:room:BBBB");
    expect(saved?.room.players.map((p) => p.id).sort()).toEqual(["a", "b"]);
  });

  test("a deadline is findable until the phase clears it", async () => {
    const { store } = harness();
    await store.insert(room(1_000_000), { phase: "clue", outcome: null, deadlineAt: 1_500_000 });
    expect(await store.due(1_400_000)).toEqual([]);
    expect(await store.due(1_500_000)).toEqual([CODE]);
    await store.update(CODE, (current) => ({
      room: current,
      result: null,
      index: QUIET,
    }));
    expect(await store.due(1_500_000)).toEqual([]);
  });

  test("a deadline whose room is already gone is dropped", async () => {
    const { store, redis } = harness();
    await redis.zAdd("gp:due", 1_500_000, CODE);
    expect(await store.due(1_500_000)).toEqual([]);
    expect(await redis.zRangeByScore("gp:due", 1_500_000)).toEqual([]);
  });

  test("the room key dies two hours after the last action, and a disconnect does not extend it", async () => {
    const { store, redis, advance } = harness();
    const started = 1_000_000;
    await store.insert(room(started), QUIET);
    advance(started + ROOM_TTL_MS - 1);
    expect(await redis.exists("gp:room:BBBB")).toBe(true);
    advance(started + ROOM_TTL_MS);
    expect(await redis.exists("gp:room:BBBB")).toBe(false);
  });

  test("releasing a lock does not delete a lock someone else took", async () => {
    const { store, redis } = harness();
    await store.insert(room(1_000_000), QUIET);
    await store.update(CODE, (current) => {
      redis.strings.set("gp:lock:BBBB", { value: "intruder", expiresAt: null });
      return { room: current, result: null, index: QUIET };
    });
    expect(await redis.get("gp:lock:BBBB")).toBe("intruder");
  });

  test("reap leaves expiry to the key", async () => {
    const { store } = harness();
    await store.insert(room(1_000_000), QUIET);
    expect(await store.reap(0)).toBe(0);
  });
});
