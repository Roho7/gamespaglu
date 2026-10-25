/**
 * The room layer, as pure functions over a room record: seats, host, settings, the deal, and the
 * score applied when a game ends. Each game's rules sit behind its module; storage sits behind the
 * store. Nothing here touches a socket, a database or the clock.
 */
import {
  ROOM_TTL_MS,
  type DeviceId,
  type GameId,
  type GameTypes,
  type PlayerId,
  type RoomCode,
  type RoomState,
} from "../../../shared/protocol";
import { GameError, reject } from "./errors";
import type { AnyGameModule, Now, Rng } from "./module";

export type PlayerRecord = {
  id: PlayerId;
  deviceId: DeviceId;
  name: string;
  seat: number;
  connected: boolean;
  score: number;
};

export type RoomRecord = {
  code: RoomCode;
  game: GameId;
  hostId: PlayerId | null;
  settings: GameTypes[GameId]["settings"];
  players: PlayerRecord[];
  round: { no: number; state: unknown } | null;
  /** When a scheduled rematch deals, or null when none is counting down. */
  dealAt: number | null;
  lastActiveAt: number;
};

export type Newcomer = { id: PlayerId; deviceId: DeviceId; name: string };

export const isStale = (room: RoomRecord, now: number) => now - room.lastActiveAt > ROOM_TTL_MS;

const touched = (room: RoomRecord, now: Now): RoomRecord => ({ ...room, lastActiveAt: now() });

const seated = (room: RoomRecord, playerId: PlayerId): PlayerRecord =>
  room.players.find((p) => p.id === playerId) ??
  reject("NOT_IN_ROOM", "You do not have a seat in that room.");

function requireHost(room: RoomRecord, playerId: PlayerId) {
  seated(room, playerId);
  if (room.hostId !== playerId) reject("NOT_HOST", "Only the host can do that.");
}

const liveRound = (room: RoomRecord, mod: AnyGameModule) =>
  room.round && !mod.isOver(room.round.state) ? room.round : null;

export function openRoom(
  mod: AnyGameModule,
  code: RoomCode,
  host: Newcomer,
  settings: unknown,
  now: Now,
): RoomRecord {
  return {
    code,
    game: mod.id,
    hostId: host.id,
    settings: mod.parseSettings(settings ?? {}, mod.defaultSettings),
    players: [{ ...host, seat: 0, connected: true, score: 0 }],
    round: null,
    dealAt: null,
    lastActiveAt: now(),
  };
}

/**
 * A device that already holds a seat is reconnecting, not joining, so retyping the code after
 * closing the tab restores the seat instead of being refused as a duplicate name.
 */
export function seat(
  room: RoomRecord,
  mod: AnyGameModule,
  newcomer: Newcomer,
  now: Now,
): { room: RoomRecord; playerId: PlayerId } {
  if (room.game !== mod.id) reject("WRONG_GAME", "That code is for a different game.");
  const existing = room.players.find((p) => p.deviceId === newcomer.deviceId);
  if (existing) {
    const players = room.players.map((p) =>
      p.id === existing.id ? { ...p, name: newcomer.name, connected: true } : p,
    );
    return { room: touched({ ...room, players }, now), playerId: existing.id };
  }
  if (room.players.length >= mod.maxPlayers) {
    reject("ROOM_FULL", `That room already has ${mod.maxPlayers} players.`);
  }
  const lower = newcomer.name.toLowerCase();
  if (room.players.some((p) => p.name.toLowerCase() === lower)) {
    reject("NAME_TAKEN", "Someone in there is already using that name.");
  }
  const used = new Set(room.players.map((p) => p.seat));
  let free = 0;
  while (used.has(free)) free++;
  const player: PlayerRecord = { ...newcomer, seat: free, connected: true, score: 0 };
  return {
    room: touched({ ...room, players: [...room.players, player] }, now),
    playerId: player.id,
  };
}

/** Never creates a seat: a resume for a seat that is gone must fail loudly, not seat a stranger. */
export function reseat(
  room: RoomRecord,
  deviceId: DeviceId,
  now: Now,
): { room: RoomRecord; playerId: PlayerId } {
  const player =
    room.players.find((p) => p.deviceId === deviceId) ??
    reject("NOT_IN_ROOM", "You do not have a seat in that room.");
  return { room: touched(setPresence(room, player.id, true), now), playerId: player.id };
}

/** Presence only. A dropped socket is a phone locking in a pocket, never a departure. */
export function setPresence(room: RoomRecord, playerId: PlayerId, connected: boolean): RoomRecord {
  return {
    ...room,
    players: room.players.map((p) => (p.id === playerId ? { ...p, connected } : p)),
  };
}

function withScores(players: PlayerRecord[], delta: Record<PlayerId, number>): PlayerRecord[] {
  return players.map((p) => ({ ...p, score: p.score + (delta[p.id] ?? 0) }));
}

/** Stores the next game state, scoring it exactly once, on the transition to over. */
function advance(room: RoomRecord, mod: AnyGameModule, next: unknown): RoomRecord {
  const round = room.round ?? reject("WRONG_PHASE", "No round is running.");
  const ended = !mod.isOver(round.state) && mod.isOver(next);
  return {
    ...room,
    round: { ...round, state: next },
    players: ended ? withScores(room.players, mod.score(next)) : room.players,
  };
}

/** The host passes to the longest-seated player, preferring someone connected. */
function nextHost(players: PlayerRecord[], current: PlayerId | null): PlayerId | null {
  if (current && players.some((p) => p.id === current)) return current;
  const ranked = [...players].sort(
    (a, b) => Number(b.connected) - Number(a.connected) || a.seat - b.seat,
  );
  return ranked[0]?.id ?? null;
}

/** Mid-round, the game decides what a departure means. An emptied room is dropped. */
export function unseat(
  room: RoomRecord,
  mod: AnyGameModule,
  playerId: PlayerId,
  now: Now,
): RoomRecord | null {
  seated(room, playerId);
  const round = liveRound(room, mod);
  const left =
    round && mod.includes(round.state, playerId)
      ? advance(room, mod, mod.removePlayer(round.state, playerId))
      : room;
  const players = left.players.filter((p) => p.id !== playerId);
  if (players.length === 0) return null;
  return touched({ ...left, players, hostId: nextHost(players, left.hostId) }, now);
}

export function kick(
  room: RoomRecord,
  mod: AnyGameModule,
  hostId: PlayerId,
  targetId: PlayerId,
  now: Now,
): RoomRecord | null {
  requireHost(room, hostId);
  return unseat(room, mod, targetId, now);
}

export function configure(
  room: RoomRecord,
  mod: AnyGameModule,
  playerId: PlayerId,
  raw: unknown,
  now: Now,
): RoomRecord {
  requireHost(room, playerId);
  const settings = mod.parseSettings(raw, room.settings);
  const round = liveRound(room, mod);
  return touched(
    {
      ...room,
      settings,
      round: round ? { ...round, state: mod.settingsChanged(round.state, settings) } : room.round,
    },
    now,
  );
}

/** Everyone seated now is frozen into the new deal. */
export function deal(
  room: RoomRecord,
  mod: AnyGameModule,
  playerId: PlayerId,
  rng: Rng,
  now: Now,
): RoomRecord {
  requireHost(room, playerId);
  if (liveRound(room, mod)) reject("WRONG_PHASE", "Finish this round first.");
  if (room.dealAt !== null) reject("WRONG_PHASE", "A new game is already on its way.");
  if (room.round && mod.rematchDelayMs > 0) {
    return touched({ ...room, dealAt: now() + mod.rematchDelayMs }, now);
  }
  return dealNow(room, mod, rng, now);
}

/** Freezes everyone seated right now into the next deal. */
function dealNow(room: RoomRecord, mod: AnyGameModule, rng: Rng, now: Now): RoomRecord {
  const seats = [...room.players]
    .sort((a, b) => a.seat - b.seat)
    .map((p) => ({ id: p.id, name: p.name }));
  const state = mod.deal(seats, room.settings, room.round?.state ?? null, rng, now);
  return touched({ ...room, dealAt: null, round: { no: (room.round?.no ?? 0) + 1, state } }, now);
}

export function abort(room: RoomRecord, mod: AnyGameModule, playerId: PlayerId, now: Now): RoomRecord {
  requireHost(room, playerId);
  const round = liveRound(room, mod) ?? reject("WRONG_PHASE", "No round is running.");
  return touched(advance(room, mod, mod.abort(round.state)), now);
}

export function play(
  room: RoomRecord,
  mod: AnyGameModule,
  playerId: PlayerId,
  raw: unknown,
  rng: Rng,
  now: Now,
): RoomRecord {
  seated(room, playerId);
  const round = room.round ?? reject("WRONG_PHASE", "No round is running.");
  const action = mod.parseAction(raw);
  const next = mod.act(round.state, playerId, action, { isHost: room.hostId === playerId, rng, now });
  return touched(advance(room, mod, next), now);
}

/**
 * Deals a rematch whose countdown has run out, or times out the current phase if its deadline has
 * passed. A rematch the table can no longer fill, because people left during the countdown, is
 * called off rather than retried forever.
 */
export function expire(room: RoomRecord, mod: AnyGameModule, rng: Rng, now: Now): RoomRecord {
  if (room.dealAt !== null) {
    if (room.dealAt > now()) return room;
    try {
      return dealNow(room, mod, rng, now);
    } catch (err) {
      if (err instanceof GameError) return { ...room, dealAt: null };
      throw err;
    }
  }
  const round = liveRound(room, mod);
  const due = round ? mod.deadline(round.state) : null;
  if (!round || due === null || due > now()) return room;
  return advance(room, mod, mod.expire(round.state));
}

/** The next moment the sweep must act on this room: a rematch deal, or the phase timing out. */
export function dueAt(room: RoomRecord, mod: AnyGameModule): number | null {
  if (room.dealAt !== null) return room.dealAt;
  const round = liveRound(room, mod);
  return round ? mod.deadline(round.state) : null;
}

/** One recipient's view. Only `you` and the private half of the round differ between players. */
export function viewFor(room: RoomRecord, mod: AnyGameModule, you: PlayerId): RoomState {
  const round = room.round;
  const inRound = round !== null && mod.includes(round.state, you);
  return {
    game: room.game,
    code: room.code,
    phase: round ? mod.phase(round.state) : "lobby",
    roundNo: round?.no ?? 0,
    players: [...room.players]
      .sort((a, b) => a.seat - b.seat)
      .map((p) => ({
        id: p.id,
        name: p.name,
        seat: p.seat,
        connected: p.connected,
        isHost: p.id === room.hostId,
        score: p.score,
      })),
    hostId: room.hostId ?? "",
    you,
    minPlayers: mod.minPlayers,
    maxPlayers: mod.maxPlayers,
    settings: room.settings,
    startsAt: room.dealAt,
    round: round ? mod.publicView(round.state, round.no) : null,
    your: round && inRound ? mod.privateView(round.state, you) : null,
  } as RoomState;
}
