import type { RoomCode } from "../../../shared/protocol";
import type { RoomRecord } from "./room";

/** What a mutation hands back: the room to save, or null to delete it, and a result for the caller. */
export type Mutation<T> = { room: RoomRecord | null; result: T };

/** Facts about the current round that the store keeps queryable without reading game state. */
export type RoundIndex = { phase: string; outcome: string | null; deadlineAt: number | null };

export type IndexedMutation<T> = Mutation<T> & { index: RoundIndex };

/**
 * Where rooms live. Every read-then-write goes through `update`, which holds the room exclusively
 * for the duration, so two players tapping the last action at the same instant cannot both see
 * "everyone is done" and both advance the phase.
 */
export interface RoomStore {
  /** False when the code is already taken. */
  insert(room: RoomRecord, index: RoundIndex): Promise<boolean>;
  /** Throws ROOM_NOT_FOUND when there is no such room. `fn` must be pure. */
  update<T>(code: RoomCode, fn: (room: RoomRecord) => IndexedMutation<T>): Promise<Mutation<T>>;
  /** Rooms whose current phase is past its deadline. */
  due(now: number): Promise<RoomCode[]>;
  /** Deletes rooms untouched since `before`. */
  reap(before: number): Promise<number>;
}
