import type { RoomCode } from "../../../shared/protocol";
import { reject } from "./errors";
import type { RoomRecord } from "./room";
import type { IndexedMutation, Mutation, RoomStore, RoundIndex } from "./store";

type Entry = { room: RoomRecord; index: RoundIndex };


export class MemoryRoomStore implements RoomStore {
  private readonly rooms = new Map<RoomCode, Entry>();
  private readonly queues = new Map<RoomCode, Promise<unknown>>();

  async insert(room: RoomRecord, index: RoundIndex): Promise<boolean> {
    if (this.rooms.has(room.code)) return false;
    this.rooms.set(room.code, { room: structuredClone(room), index });
    return true;
  }

  update<T>(code: RoomCode, fn: (room: RoomRecord) => IndexedMutation<T>): Promise<Mutation<T>> {
    const run = async (): Promise<Mutation<T>> => {
      const entry = this.rooms.get(code) ?? reject("ROOM_NOT_FOUND", "No room with that code.");
      const { room, result, index } = fn(structuredClone(entry.room));
      if (room) this.rooms.set(code, { room: structuredClone(room), index });
      else this.rooms.delete(code);
      return { room, result };
    };
    const queued = (this.queues.get(code) ?? Promise.resolve()).then(run, run);
    this.queues.set(code, queued.catch(() => undefined));
    return queued;
  }

  async due(now: number): Promise<RoomCode[]> {
    return [...this.rooms]
      .filter(([, e]) => e.index.deadlineAt !== null && e.index.deadlineAt <= now)
      .map(([code]) => code);
  }

  async reap(before: number): Promise<number> {
    let removed = 0;
    for (const [code, e] of this.rooms) {
      if (e.room.lastActiveAt < before) {
        this.rooms.delete(code);
        removed++;
      }
    }
    return removed;
  }

  /** The stored record, for assertions. */
  peek(code: RoomCode): RoomRecord | null {
    const entry = this.rooms.get(code);
    return entry ? structuredClone(entry.room) : null;
  }
}
