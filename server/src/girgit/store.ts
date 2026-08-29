import type { PoolClient } from "pg";
import { pool, withTx } from "../db";
import { RoomError } from "../rooms";
import { GRIDS } from "./grids";
import { dealRound, type RoundState } from "./engine";
import {
  DEFAULT_CLUE_SECONDS,
  MIN_PLAYERS,
  type PlayerId,
  type PublicRound,
  type RoomPhase,
  type YourRound,
} from "../../../shared/protocol";

/**
 * Runs `fn` with the room row locked.
 *
 * Every read-then-write on round state goes through here. The motivating case
 * is real: two players tapping the last clue at the same instant must not both
 * observe "everyone is in" and both advance the phase. Without the lock that is
 * a lost update, and it would present as a round that skipped the discussion.
 */
export async function withRoundLock<T>(
  code: string,
  fn: (c: PoolClient, round: RoundState | null) => Promise<T>,
): Promise<T> {
  return withTx(async (c) => {
    const room = await c.query(`select 1 from gp.rooms where code = $1 for update`, [code]);
    if (room.rowCount === 0) {
      throw new RoomError({ code: "ROOM_NOT_FOUND", message: "That room is gone." });
    }
    const { rows } = await c.query<{ state: RoundState }>(
      `select state from gp.rounds where room_code = $1 order by round_no desc limit 1`,
      [code],
    );
    return fn(c, rows[0]?.state ?? null);
  });
}

export async function saveRound(c: PoolClient, code: string, roundNo: number, state: RoundState) {
  await c.query(
    `insert into gp.rounds (room_code, round_no, state, phase, outcome)
     values ($1, $2, $3, $4, $5)
     on conflict (room_code, round_no) do update
       set state = excluded.state,
           phase = excluded.phase,
           outcome = excluded.outcome,
           updated_at = now()`,
    [code, roundNo, JSON.stringify(state), state.phase, state.outcome],
  );
  await c.query(
    `update gp.rooms set phase = $2, round_no = $3, last_active_at = now() where code = $1`,
    [code, state.phase, roundNo],
  );
}

/**
 * Deals a new round.
 *
 * This is the round boundary, and therefore the ONLY point at which the roster
 * changes: queued leavers go now, and everybody still seated is frozen into the
 * round. A round is never redealt underneath the people playing it.
 */
export async function startRound(code: string, hostPlayerId: PlayerId) {
  return withRoundLock(code, async (c, previous) => {
    const host = await c.query<{
      host_player_id: string | null;
      round_no: number;
      clue_seconds: number;
    }>(
      `select host_player_id, round_no, clue_seconds from gp.rooms where code = $1`,
      [code],
    );
    if (host.rows[0]?.host_player_id !== hostPlayerId) {
      throw new RoomError({ code: "NOT_HOST", message: "Only the host starts a round." });
    }
    if (previous && previous.phase !== "reveal") {
      throw new RoomError({ code: "WRONG_PHASE", message: "Finish this round first." });
    }

    await c.query(`delete from gp.players where room_code = $1 and pending_leave`, [code]);

    const { rows: players } = await c.query<{ id: string }>(
      `select id from gp.players where room_code = $1 order by seat`,
      [code],
    );
    if (players.length < MIN_PLAYERS) {
      throw new RoomError({
        code: "NOT_ENOUGH_PLAYERS",
        message: `Girgit needs at least ${MIN_PLAYERS} players.`,
      });
    }

    // Without replacement across the whole session, not merely "not the same
    // as last time". A repeat inside one sitting is read as a bug — it is the
    // reason src/lib/shuffle-bag.ts exists on the other game — and the history
    // is already in the rounds table, so no extra state is needed.
    const { rows: used } = await c.query<{ grid_id: string }>(
      `select distinct state->>'gridId' as grid_id from gp.rounds where room_code = $1`,
      [code],
    );
    const seen = new Set(used.map((r) => r.grid_id));
    // Once the bag is empty it refills, minus the one just played, so the
    // reshuffle never immediately repeats.
    const unseen = GRIDS.filter((g) => !seen.has(g.id));
    const bag = unseen.length ? unseen : GRIDS.filter((g) => g.id !== previous?.gridId);
    const grid = bag[Math.floor(Math.random() * bag.length)];

    const roundNo = (host.rows[0]?.round_no ?? 0) + 1;
    const state = dealRound(
      players.map((p) => p.id),
      grid,
      Math.random,
      Date.now,
      host.rows[0]?.clue_seconds ?? DEFAULT_CLUE_SECONDS,
    );
    await saveRound(c, code, roundNo, state);
    return state;
  });
}

/** Applies a pure engine transition under the lock and persists the result. */
export async function transition(
  code: string,
  fn: (state: RoundState) => RoundState,
): Promise<RoundState> {
  return withRoundLock(code, async (c, state) => {
    if (!state) {
      throw new RoomError({ code: "WRONG_PHASE", message: "No round is running." });
    }
    const next = fn(state);
    const { rows } = await c.query<{ round_no: number }>(
      `select round_no from gp.rooms where code = $1`,
      [code],
    );
    await saveRound(c, code, rows[0].round_no, next);
    return next;
  });
}

export async function applyScores(code: string, delta: Record<PlayerId, number>) {
  const entries = Object.entries(delta).filter(([, n]) => n !== 0);
  if (entries.length === 0) return;
  await pool.query(
    `update gp.players as p set score = p.score + v.delta
       from (select unnest($2::uuid[]) as id, unnest($3::int[]) as delta) v
      where p.id = v.id and p.room_code = $1`,
    [code, entries.map(([id]) => id), entries.map(([, n]) => n)],
  );
}

/**
 * Rooms whose current phase is past its deadline. Cheap: one indexed scan over
 * the latest round per room, and rooms are few.
 */
export async function expiredRooms(): Promise<string[]> {
  const { rows } = await pool.query<{ room_code: string }>(
    `select distinct on (room_code) room_code, state
       from gp.rounds
      order by room_code, round_no desc`,
  );
  const now = Date.now();
  const out: string[] = [];
  for (const r of rows as unknown as { room_code: string; state: RoundState }[]) {
    const d = r.state?.deadlineAt;
    if (typeof d === "number" && d <= now) out.push(r.room_code);
  }
  return out;
}

export async function currentRound(code: string): Promise<RoundState | null> {
  const { rows } = await pool.query<{ state: RoundState }>(
    `select state from gp.rounds where room_code = $1 order by round_no desc limit 1`,
    [code],
  );
  return rows[0]?.state ?? null;
}

// ------------------------------------------------------------------ views ---

/** Everything the room may see. The secret appears only at the reveal. */
export function publicRound(state: RoundState, roundNo: number): PublicRound {
  const revealed = state.phase === "reveal";
  const cluesDone = state.phase !== "clues";
  const votesResolved = !state.voteOpen;

  return {
    roundNo,
    theme: state.theme,
    cells: state.cells,
    cluesIn: Object.keys(state.clues).length,
    cluesTotal: state.players.length,
    // Who has acted is public; what they said is not. Knowing the table is
    // waiting on you is the whole point, and it leaks nothing.
    cluedBy: state.players.filter((p) => state.clues[p]),
    votedBy: state.players.filter((p) => state.votes[p]),
    deadlineAt: state.deadlineAt,
    skipped: state.skipped ?? [],
    clues: cluesDone
      ? state.players
          .filter((p) => state.clues[p])
          .map((p) => ({ playerId: p, word: state.clues[p] }))
      : null,
    voteOpen: state.voteOpen,
    votesIn: Object.keys(state.votes).length,
    votes: votesResolved
      ? Object.entries(state.votes).map(([voterId, targetId]) => ({ voterId, targetId }))
      : null,
    accused: state.accused,
    outcome: state.outcome,
    girgitId: revealed ? state.girgit : null,
    secretIndex: revealed ? state.secretIndex : null,
  };
}

/** The half that differs per recipient. */
export function yourRound(state: RoundState, playerId: PlayerId): YourRound {
  const isGirgit = playerId === state.girgit;
  return {
    isGirgit,
    secretIndex: isGirgit ? null : state.secretIndex,
    hasClued: Boolean(state.clues[playerId]),
    hasVoted: Boolean(state.votes[playerId]),
  };
}

export const phaseOf = (state: RoundState | null): RoomPhase => state?.phase ?? "lobby";
