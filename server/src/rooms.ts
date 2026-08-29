import type { PoolClient } from "pg";
import { pool, withTx } from "./db";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  ROOM_TTL_MS,
  type Err,
  type RoomCode,
  type RoomPhase,
  type RoomState,
} from "../../shared/protocol";

export class RoomError extends Error {
  constructor(public readonly err: Err) {
    super(err.message);
  }
}
const fail = (code: Err["code"], message: string): never => {
  throw new RoomError({ code, message });
};

type PlayerRow = {
  id: string;
  room_code: string;
  name: string;
  seat: number;
  connected: boolean;
  pending_leave: boolean;
  score: number;
};

function randomCode(): RoomCode {
  let out = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    out += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return out;
}

/** Locks the room row, so seat assignment and capacity cannot race. */
async function lockRoom(c: PoolClient, code: RoomCode) {
  const { rows } = await c.query<{
    code: string;
    phase: RoomPhase;
    round_no: number;
    host_player_id: string | null;
    last_active_at: Date;
  }>(
    `select code, phase, round_no, host_player_id, last_active_at
       from gp.rooms where code = $1 for update`,
    [code],
  );
  if (rows.length === 0) fail("ROOM_NOT_FOUND", "No room with that code.");
  const room = rows[0];
  if (Date.now() - room.last_active_at.getTime() > ROOM_TTL_MS) {
    await c.query(`delete from gp.rooms where code = $1`, [code]);
    fail("ROOM_NOT_FOUND", "That room has expired.");
  }
  return room;
}

const touch = (c: PoolClient, code: RoomCode) =>
  c.query(`update gp.rooms set last_active_at = now() where code = $1`, [code]);

async function playersOf(c: PoolClient | typeof pool, code: RoomCode) {
  const { rows } = await c.query<PlayerRow>(
    `select id, room_code, name, seat, connected, pending_leave, score
       from gp.players where room_code = $1 order by seat`,
    [code],
  );
  return rows;
}

export async function createRoom(deviceId: string, name: string) {
  return withTx(async (c) => {
    // Collisions are rare at 194k codes but not impossible, and a duplicate
    // code would drop a stranger into someone's game.
    for (let attempt = 0; attempt < 12; attempt++) {
      const code = randomCode();
      const taken = await c.query(`select 1 from gp.rooms where code = $1`, [code]);
      if (taken.rowCount) continue;

      await c.query(`insert into gp.rooms (code) values ($1)`, [code]);
      const { rows } = await c.query<{ id: string }>(
        `insert into gp.players (room_code, device_id, name, seat)
         values ($1, $2, $3, 0) returning id`,
        [code, deviceId, name],
      );
      const playerId = rows[0].id;
      await c.query(`update gp.rooms set host_player_id = $1 where code = $2`, [
        playerId,
        code,
      ]);
      return { code, playerId };
    }
    return fail("INTERNAL", "Could not allocate a room code.");
  });
}

export async function joinRoom(code: RoomCode, deviceId: string, name: string) {
  return withTx(async (c) => {
    await lockRoom(c, code);

    // A device that already holds a seat is reconnecting, not joining. Treat it
    // as a resume so that reopening the tab and typing the code again — which
    // people do — restores the seat instead of being refused as a duplicate.
    const existing = await c.query<{ id: string }>(
      `select id from gp.players where room_code = $1 and device_id = $2`,
      [code, deviceId],
    );
    if (existing.rowCount) {
      await c.query(
        `update gp.players set connected = true, pending_leave = false, name = $2
           where id = $1`,
        [existing.rows[0].id, name],
      );
      await touch(c, code);
      return { code, playerId: existing.rows[0].id };
    }

    const players = await playersOf(c, code);
    if (players.length >= MAX_PLAYERS) {
      fail("ROOM_FULL", `That room already has ${MAX_PLAYERS} players.`);
    }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      fail("NAME_TAKEN", "Someone in there is already using that name.");
    }

    // Lowest free seat, so a departure does not leave a permanent hole.
    const used = new Set(players.map((p) => p.seat));
    let seat = 0;
    while (used.has(seat)) seat++;

    const { rows } = await c.query<{ id: string }>(
      `insert into gp.players (room_code, device_id, name, seat)
       values ($1, $2, $3, $4) returning id`,
      [code, deviceId, name, seat],
    );
    await touch(c, code);
    return { code, playerId: rows[0].id };
  });
}

/**
 * Reload, lock screen, or server redeploy. Deliberately cannot create a seat:
 * a resume for a seat that no longer exists must fail loudly rather than
 * quietly adding a nameless stranger to somebody's game.
 */
export async function resumeRoom(code: RoomCode, deviceId: string) {
  return withTx(async (c) => {
    await lockRoom(c, code);
    const { rows } = await c.query<{ id: string }>(
      `update gp.players set connected = true
         where room_code = $1 and device_id = $2 returning id`,
      [code, deviceId],
    );
    if (rows.length === 0) fail("NOT_IN_ROOM", "You do not have a seat in that room.");
    await touch(c, code);
    return { code, playerId: rows[0].id };
  });
}

/**
 * Presence only. A lost socket is somebody's phone locking in their pocket
 * while they argue — it must never surrender the seat.
 */
export async function setConnected(playerId: string, connected: boolean) {
  await pool.query(`update gp.players set connected = $2 where id = $1`, [
    playerId,
    connected,
  ]);
}

export async function leaveRoom(playerId: string) {
  return withTx(async (c) => {
    const { rows } = await c.query<{ room_code: string }>(
      `select room_code from gp.players where id = $1`,
      [playerId],
    );
    if (rows.length === 0) return null;
    const code = rows[0].room_code;
    await lockRoom(c, code);

    // In the lobby there is no round to protect, so leaving is immediate.
    // Mid-round it is queued — see applyPendingLeaves, called at the deal.
    await c.query(`delete from gp.players where id = $1`, [playerId]);
    await reassignHostIfNeeded(c, code);
    await touch(c, code);
    return code;
  });
}

export async function kickPlayer(hostPlayerId: string, targetId: string) {
  return withTx(async (c) => {
    const { rows } = await c.query<{ room_code: string; host_player_id: string | null }>(
      `select p.room_code, r.host_player_id
         from gp.players p join gp.rooms r on r.code = p.room_code
        where p.id = $1`,
      [hostPlayerId],
    );
    if (rows.length === 0) fail("NOT_IN_ROOM", "You are not in a room.");
    const { room_code: code, host_player_id } = rows[0];
    if (host_player_id !== hostPlayerId) fail("NOT_HOST", "Only the host can do that.");
    await lockRoom(c, code);
    await c.query(`delete from gp.players where id = $1 and room_code = $2`, [
      targetId,
      code,
    ]);
    await reassignHostIfNeeded(c, code);
    await touch(c, code);
    return code;
  });
}

/** Host passes to the longest-seated survivor, preferring someone connected. */
async function reassignHostIfNeeded(c: PoolClient, code: RoomCode) {
  const { rows } = await c.query<{ host_player_id: string | null }>(
    `select host_player_id from gp.rooms where code = $1`,
    [code],
  );
  const current = rows[0]?.host_player_id;
  if (current) {
    const still = await c.query(`select 1 from gp.players where id = $1`, [current]);
    if (still.rowCount) return;
  }
  const { rows: next } = await c.query<{ id: string }>(
    `select id from gp.players where room_code = $1
      order by connected desc, seat asc limit 1`,
    [code],
  );
  await c.query(`update gp.rooms set host_player_id = $1 where code = $2`, [
    next[0]?.id ?? null,
    code,
  ]);
  // An empty room is worthless; dropping it frees the code immediately.
  if (!next[0]) await c.query(`delete from gp.rooms where code = $1`, [code]);
}

export type RoomSnapshot = {
  room: {
    code: string;
    phase: RoomPhase;
    round_no: number;
    host_player_id: string | null;
    clue_seconds: number;
  };
  players: PlayerRow[];
};

/**
 * Read the room and its roster ONCE.
 *
 * This used to be per recipient, inside the broadcast loop — two queries times
 * however many people were in the room. At eight players that is sixteen round
 * trips to build one broadcast, and it is invisible on a local database where a
 * round trip is under a millisecond. Against a real one it is most of the
 * latency of every single tap.
 */
export async function getRoomSnapshot(code: RoomCode): Promise<RoomSnapshot> {
  const { rows } = await pool.query<RoomSnapshot["room"]>(
    `select code, phase, round_no, host_player_id, clue_seconds
       from gp.rooms where code = $1`,
    [code],
  );
  if (rows.length === 0) fail("ROOM_NOT_FOUND", "That room is gone.");
  return { room: rows[0], players: await playersOf(pool, code) };
}

/**
 * Pure. The only part that differs per recipient is `you` and the private half
 * of the round, so the expensive part is shared and this is just shaping.
 */
export function roomStateFrom(
  snapshot: RoomSnapshot,
  you: string,
  round?: { publicView: RoomState["round"]; yourView: RoomState["your"] },
): RoomState {
  const { room, players } = snapshot;
  return {
    code: room.code,
    game: "girgit",
    phase: room.phase,
    roundNo: room.round_no,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      seat: p.seat,
      connected: p.connected,
      pendingLeave: p.pending_leave,
      isHost: p.id === room.host_player_id,
      score: p.score,
    })),
    hostId: room.host_player_id ?? "",
    you,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    clueSeconds: room.clue_seconds,
    round: round?.publicView ?? null,
    your: round?.yourView ?? null,
  };
}

/** Rooms nobody has touched in TTL. Cheap enough to run on a timer. */
export async function reapExpiredRooms(): Promise<number> {
  const { rowCount } = await pool.query(
    `delete from gp.rooms where last_active_at < now() - ($1::bigint * interval '1 millisecond')`,
    [ROOM_TTL_MS],
  );
  return rowCount ?? 0;
}
