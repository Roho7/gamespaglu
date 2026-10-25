import {
  MAX_NAME_LENGTH,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  ROOM_TTL_MS,
  isDeviceId,
  isGameId,
  isRoomCode,
  normaliseCode,
  normaliseName,
  type GameId,
  type PlayerId,
  type RoomCode,
  type RoomState,
} from "../../../shared/protocol";
import { GameError, reject } from "./errors";
import type { AnyGameModule, Now, Rng } from "./module";
import type { Games } from "./registry";
import {
  abort,
  configure,
  deal,
  expire,
  isStale,
  kick,
  openRoom,
  play,
  reseat,
  seat,
  setPresence,
  unseat,
  viewFor,
  type RoomRecord,
} from "./room";
import type { IndexedMutation, RoomStore, RoundIndex } from "./store";

export type ServiceDeps = { store: RoomStore; games: Games; rng: Rng; now: Now; newId: () => string };

export type Seated = { room: RoomRecord; playerId: PlayerId };

const CODE_ATTEMPTS = 12;

function validName(raw: unknown): string {
  const name = normaliseName(String(raw ?? ""));
  if (!name) reject("BAD_NAME", "Type a name first.");
  if (name.length > MAX_NAME_LENGTH) {
    reject("BAD_NAME", `Keep it under ${MAX_NAME_LENGTH} characters.`);
  }
  return name;
}

function validDevice(raw: unknown): string {
  if (!isDeviceId(raw)) {
    reject("BAD_DEVICE", "Your device id is unreadable. Reload to get a new one.");
  }
  return raw as string;
}

function validCode(raw: unknown): RoomCode {
  const code = normaliseCode(String(raw ?? ""));
  if (!isRoomCode(code)) reject("BAD_CODE", "That is not a room code.");
  return code;
}

function validGame(raw: unknown): GameId {
  if (!isGameId(raw)) reject("BAD_GAME", "There is no such game.");
  return raw as GameId;
}

const STALE = Symbol("stale");

/**
 * Every room operation, over any store. Validates untrusted input, runs the pure room layer inside
 * the store's lock, and hands back the saved room for broadcasting. The socket server and the
 * in-browser local room are both thin wrappers around this.
 */
export class RoomService {
  constructor(private readonly deps: ServiceDeps) {}

  module(game: GameId): AnyGameModule {
    return this.deps.games[game];
  }

  private index(room: RoomRecord): RoundIndex {
    const mod = this.module(room.game);
    const state = room.round?.state;
    if (state === undefined) return { phase: "lobby", outcome: null, deadlineAt: null };
    return {
      phase: mod.phase(state),
      outcome: mod.outcome(state),
      deadlineAt: mod.isOver(state) ? null : mod.deadline(state),
    };
  }

  private newCode(): RoomCode {
    const { rng } = this.deps;
    let out = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      out += ROOM_CODE_ALPHABET[Math.floor(rng() * ROOM_CODE_ALPHABET.length)];
    }
    return out;
  }

  /** Runs `fn` under the room's lock. An expired room is deleted and reported as gone. */
  private async mutate<T>(
    code: RoomCode,
    fn: (room: RoomRecord, mod: AnyGameModule) => { room: RoomRecord | null; result: T },
  ): Promise<{ room: RoomRecord | null; result: T }> {
    const { room, result } = await this.deps.store.update(
      code,
      (current): IndexedMutation<T | typeof STALE> => {
        if (isStale(current, this.deps.now())) {
          return { room: null, result: STALE, index: this.index(current) };
        }
        const mod = this.module(current.game);
        const loaded = { ...current, settings: mod.parseSettings(current.settings, mod.defaultSettings) };
        const out = fn(loaded, mod);
        return { ...out, index: out.room ? this.index(out.room) : this.index(current) };
      },
    );
    if (result === STALE) reject("ROOM_NOT_FOUND", "That room has expired.");
    return { room, result: result as T };
  }

  private async change(
    code: RoomCode,
    fn: (room: RoomRecord, mod: AnyGameModule) => RoomRecord | null,
  ): Promise<RoomRecord | null> {
    const { room } = await this.mutate(code, (r, mod) => ({ room: fn(r, mod), result: null }));
    return room;
  }

  async create(rawGame: unknown, rawDevice: unknown, rawName: unknown, settings?: unknown): Promise<Seated> {
    const mod = this.module(validGame(rawGame));
    const host = { id: this.deps.newId(), deviceId: validDevice(rawDevice), name: validName(rawName) };
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
      const room = openRoom(mod, this.newCode(), host, settings, this.deps.now);
      if (await this.deps.store.insert(room, this.index(room))) return { room, playerId: host.id };
    }
    return reject("INTERNAL", "Could not allocate a room code.");
  }

  async join(rawCode: unknown, rawGame: unknown, rawDevice: unknown, rawName: unknown): Promise<Seated> {
    const game = validGame(rawGame);
    const newcomer = { id: this.deps.newId(), deviceId: validDevice(rawDevice), name: validName(rawName) };
    const { room, result } = await this.mutate(validCode(rawCode), (r) => {
      const out = seat(r, this.module(game), newcomer, this.deps.now);
      return { room: out.room, result: out.playerId };
    });
    return { room: room as RoomRecord, playerId: result };
  }

  async resume(rawCode: unknown, rawDevice: unknown): Promise<Seated> {
    const deviceId = validDevice(rawDevice);
    const { room, result } = await this.mutate(validCode(rawCode), (r) => {
      const out = reseat(r, deviceId, this.deps.now);
      return { room: out.room, result: out.playerId };
    });
    return { room: room as RoomRecord, playerId: result };
  }

  leave(code: RoomCode, playerId: PlayerId) {
    return this.change(code, (r, mod) => unseat(r, mod, playerId, this.deps.now));
  }

  kick(code: RoomCode, hostId: PlayerId, targetId: unknown) {
    return this.change(code, (r, mod) => kick(r, mod, hostId, String(targetId ?? ""), this.deps.now));
  }

  configure(code: RoomCode, playerId: PlayerId, settings: unknown) {
    return this.change(code, (r, mod) => configure(r, mod, playerId, settings, this.deps.now));
  }

  start(code: RoomCode, playerId: PlayerId) {
    return this.change(code, (r, mod) => deal(r, mod, playerId, this.deps.rng, this.deps.now));
  }

  abort(code: RoomCode, playerId: PlayerId) {
    return this.change(code, (r, mod) => abort(r, mod, playerId, this.deps.now));
  }

  act(code: RoomCode, playerId: PlayerId, action: unknown) {
    return this.change(code, (r, mod) =>
      play(r, mod, playerId, action, this.deps.rng, this.deps.now),
    );
  }

  setConnected(code: RoomCode, playerId: PlayerId, connected: boolean) {
    return this.change(code, (r) => setPresence(r, playerId, connected));
  }

  /** Times out every overdue phase. One room failing never stops the others. */
  async sweep(onError: (code: RoomCode, err: unknown) => void): Promise<RoomRecord[]> {
    const changed: RoomRecord[] = [];
    for (const code of await this.deps.store.due(this.deps.now())) {
      try {
        const room = await this.change(code, (r, mod) => expire(r, mod, this.deps.now));
        if (room) changed.push(room);
      } catch (err) {
        if (!(err instanceof GameError)) onError(code, err);
      }
    }
    return changed;
  }

  reap(): Promise<number> {
    return this.deps.store.reap(this.deps.now() - ROOM_TTL_MS);
  }

  view(room: RoomRecord, you: PlayerId): RoomState {
    return viewFor(room, this.module(room.game), you);
  }
}
