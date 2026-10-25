import type { Pool, PoolClient } from "pg";
import type { GameId, RoomCode } from "../../../shared/protocol";
import { reject } from "./errors";
import type { PlayerRecord, RoomRecord } from "./room";
import type { IndexedMutation, Mutation, RoomStore, RoundIndex } from "./store";

type RoomRow = {
  code: string;
  game: GameId;
  host_player_id: string | null;
  settings: RoomRecord["settings"];
  last_active_at: Date;
};
type PlayerRow = {
  id: string;
  device_id: string;
  name: string;
  seat: number;
  connected: boolean;
  score: number;
};
type RoundRow = { round_no: number; state: unknown };

const toPlayer = (r: PlayerRow): PlayerRecord => ({
  id: r.id,
  deviceId: r.device_id,
  name: r.name,
  seat: r.seat,
  connected: r.connected,
  score: r.score,
});

/**
 * Rooms in Postgres, the source of truth, so a redeploy costs connections but not games. The round
 * is one jsonb document because the game module is the only thing that may interpret it.
 */
export class PgRoomStore implements RoomStore {
  constructor(private readonly pool: Pool) {}

  private async tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
    const c = await this.pool.connect();
    try {
      await c.query("begin");
      const out = await fn(c);
      await c.query("commit");
      return out;
    } catch (err) {
      await c.query("rollback").catch(() => undefined);
      throw err;
    } finally {
      c.release();
    }
  }

  insert(room: RoomRecord, index: RoundIndex): Promise<boolean> {
    return this.tx(async (c) => {
      const taken = await c.query(`select 1 from gp.rooms where code = $1`, [room.code]);
      if (taken.rowCount) return false;
      await c.query(
        `insert into gp.rooms (code, game, settings, phase, round_no, last_active_at)
         values ($1, $2, $3, $4, 0, $5)`,
        [room.code, room.game, JSON.stringify(room.settings), index.phase, new Date(room.lastActiveAt)],
      );
      await this.save(c, room, null, index);
      return true;
    });
  }

  update<T>(code: RoomCode, fn: (room: RoomRecord) => IndexedMutation<T>): Promise<Mutation<T>> {
    return this.tx(async (c) => {
      const before = await this.load(c, code);
      const { room, result, index } = fn(structuredClone(before));
      if (room) await this.save(c, room, before, index);
      else await c.query(`delete from gp.rooms where code = $1`, [code]);
      return { room, result };
    });
  }

  private async load(c: PoolClient, code: RoomCode): Promise<RoomRecord> {
    const { rows } = await c.query<RoomRow>(
      `select code, game, host_player_id, settings, last_active_at
         from gp.rooms where code = $1 for update`,
      [code],
    );
    const room = rows[0] ?? reject("ROOM_NOT_FOUND", "No room with that code.");
    const players = await c.query<PlayerRow>(
      `select id, device_id, name, seat, connected, score
         from gp.players where room_code = $1 order by seat`,
      [code],
    );
    const round = await c.query<RoundRow>(
      `select round_no, state from gp.rounds where room_code = $1 order by round_no desc limit 1`,
      [code],
    );
    return {
      code: room.code,
      game: room.game,
      hostId: room.host_player_id,
      settings: room.settings,
      players: players.rows.map(toPlayer),
      round: round.rows[0] ? { no: round.rows[0].round_no, state: round.rows[0].state } : null,
      lastActiveAt: room.last_active_at.getTime(),
    };
  }

  /** Departed seats go first, so their seat number and host reference are free for what follows. */
  private async save(c: PoolClient, room: RoomRecord, before: RoomRecord | null, index: RoundIndex) {
    const kept = new Set(room.players.map((p) => p.id));
    const gone = (before?.players ?? []).filter((p) => !kept.has(p.id)).map((p) => p.id);
    if (gone.length) {
      await c.query(`delete from gp.players where room_code = $1 and id = any($2::uuid[])`, [
        room.code,
        gone,
      ]);
    }
    for (const p of room.players) {
      await c.query(
        `insert into gp.players (id, room_code, device_id, name, seat, connected, score)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (id) do update
           set name = excluded.name, seat = excluded.seat,
               connected = excluded.connected, score = excluded.score`,
        [p.id, room.code, p.deviceId, p.name, p.seat, p.connected, p.score],
      );
    }
    await c.query(
      `update gp.rooms
          set host_player_id = $2, settings = $3, phase = $4, round_no = $5, last_active_at = $6
        where code = $1`,
      [
        room.code,
        room.hostId,
        JSON.stringify(room.settings),
        index.phase,
        room.round?.no ?? 0,
        new Date(room.lastActiveAt),
      ],
    );
    const round = room.round;
    const unchanged =
      round !== null &&
      before?.round?.no === round.no &&
      JSON.stringify(before.round.state) === JSON.stringify(round.state);
    if (round && !unchanged) {
      await c.query(
        `insert into gp.rounds (room_code, round_no, state, phase, outcome, deadline_at)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (room_code, round_no) do update
           set state = excluded.state, phase = excluded.phase, outcome = excluded.outcome,
               deadline_at = excluded.deadline_at, updated_at = now()`,
        [
          room.code,
          round.no,
          JSON.stringify(round.state),
          index.phase,
          index.outcome,
          index.deadlineAt === null ? null : new Date(index.deadlineAt),
        ],
      );
    }
  }

  async due(now: number): Promise<RoomCode[]> {
    const { rows } = await this.pool.query<{ room_code: string }>(
      `select room_code from (
         select distinct on (room_code) room_code, deadline_at
           from gp.rounds order by room_code, round_no desc
       ) latest where deadline_at <= $1`,
      [new Date(now)],
    );
    return rows.map((r) => r.room_code);
  }

  async reap(before: number): Promise<number> {
    const { rowCount } = await this.pool.query(`delete from gp.rooms where last_active_at < $1`, [
      new Date(before),
    ]);
    return rowCount ?? 0;
  }
}
