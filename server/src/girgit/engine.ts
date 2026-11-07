/**
 * Girgit rules. Pure: no sockets, no database, no React, and randomness and time are injected, so
 * a whole session plays out in a unit test.
 */
import {
  GIRGIT_MIN_PLAYERS,
  GRID_SIZE,
  MAX_CLUE_LENGTH,
  MAX_CLUE_WORDS,
  SCORE_GIRGIT_ESCAPED,
  SCORE_GIRGIT_GUESSED,
  SCORE_INNOCENT,
  type GirgitOutcome,
  type GirgitPhase,
  type PackId,
  type PlayerId,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { Now, Rng } from "../game/module";
import { shuffle } from "../game/random";

export type Grid = {
  id: string;
  pack: PackId;
  /** Public, including to the Girgit. Without it they cannot bluff at all. */
  theme: string;
  /** Exactly GRID_SIZE entry labels. */
  cells: string[];
};

export type RoundState = {
  phase: GirgitPhase;
  /** Frozen at the deal. A round is never redealt under the people playing it. */
  players: PlayerId[];
  girgit: PlayerId;
  gridId: string;
  /** Every grid this room has dealt, this one included, so a session never repeats one. */
  usedGridIds: string[];
  theme: string;
  cells: string[];
  secretIndex: number;
  clues: Record<PlayerId, string>;
  /** Only the clue phase is timed. */
  deadlineAt: number | null;
  /** The deadline derives from this, so changing the timer mid-phase never restarts the clock. */
  cluesStartedAt: number;
  skipped: PlayerId[];
  voteOpen: boolean;
  votes: Record<PlayerId, PlayerId>;
  /** Players who have not locked in this ballot yet. The ballot resolves when it empties. */
  pending: PlayerId[];
  /** After a split, the tied players: the only ones a revote may name. Null means anyone. */
  candidates: PlayerId[] | null;
  /** The table gets one revote per round. A second split lets the Girgit walk. */
  revoted: boolean;
  /** The count each tied player is stuck on. */
  tieVotes: number;
  accused: PlayerId | null;
  escapeGuess: number | null;
  outcome: GirgitOutcome | null;
};

/**
 * Without replacement across the session. Once every grid in the chosen packs has been played the
 * bag refills, minus the grid just played, so the reshuffle never repeats back to back.
 */
export function pickGrid(
  grids: readonly Grid[],
  packs: readonly PackId[],
  used: readonly string[],
  lastGridId: string | null,
  rng: Rng,
): Grid {
  const inPlay = grids.filter((g) => packs.includes(g.pack));
  if (inPlay.length === 0) reject("BAD_SETTING", "None of those packs has any grids.");
  const unseen = inPlay.filter((g) => !used.includes(g.id));
  const refill = inPlay.filter((g) => g.id !== lastGridId);
  const bag = unseen.length ? unseen : refill.length ? refill : inPlay;
  return bag[Math.floor(rng() * bag.length)];
}

export function dealRound(
  players: PlayerId[],
  grid: Grid,
  rng: Rng,
  now: Now,
  clueSeconds: number,
  usedGridIds: readonly string[] = [],
): RoundState {
  if (players.length < GIRGIT_MIN_PLAYERS) {
    reject("NOT_ENOUGH_PLAYERS", `Girgit needs at least ${GIRGIT_MIN_PLAYERS} players.`);
  }
  if (grid.cells.length !== GRID_SIZE) {
    reject("INTERNAL", `A grid must have exactly ${GRID_SIZE} cells.`);
  }
  const startedAt = now();
  return {
    phase: "clues",
    players: [...players],
    girgit: players[Math.floor(rng() * players.length)],
    gridId: grid.id,
    usedGridIds: usedGridIds.includes(grid.id) ? [...usedGridIds] : [...usedGridIds, grid.id],
    theme: grid.theme,
    cells: shuffle(grid.cells, rng),
    secretIndex: Math.floor(rng() * GRID_SIZE),
    clues: {},
    cluesStartedAt: startedAt,
    deadlineAt: startedAt + clueSeconds * 1000,
    skipped: [],
    voteOpen: false,
    votes: {},
    pending: [],
    candidates: null,
    revoted: false,
    tieVotes: 0,
    accused: null,
    escapeGuess: null,
    outcome: null,
  };
}

/** What one player may know. The Girgit's secret is null, and it never leaves in any other shape. */
export function dealFor(state: RoundState, playerId: PlayerId) {
  const isGirgit = playerId === state.girgit;
  return {
    theme: state.theme,
    cells: state.cells,
    isGirgit,
    secretIndex: isGirgit ? null : state.secretIndex,
  };
}

const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** True when `needle` appears in `haystack` as a whole word, case-insensitively. */
export function containsWord(haystack: string, needle: string): boolean {
  return new RegExp(`\\b${escapeRe(needle)}\\b`, "i").test(haystack);
}

export function normaliseClue(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Whole-word matching against the secret. Equality would let "big Titanic" through; a raw substring
 * would reject "syrup" because "Up" is a film, and the player could never see why.
 */
export function validateClue(state: RoundState, raw: string): string {
  const clue = normaliseClue(raw);
  if (!clue) reject("BAD_CLUE", "Type a clue first.");
  if (clue.length > MAX_CLUE_LENGTH) {
    reject("BAD_CLUE", `Keep it under ${MAX_CLUE_LENGTH} characters.`);
  }
  if (clue.split(" ").length > MAX_CLUE_WORDS) reject("BAD_CLUE", "Two words at most.");
  if (containsWord(clue, state.cells[state.secretIndex])) {
    reject("BAD_CLUE", "That gives the word away.");
  }
  return clue;
}

const requirePlayer = (state: RoundState, playerId: PlayerId) => {
  if (!state.players.includes(playerId)) reject("NOT_PLAYING", "You are not in this round.");
};

/** Clues reveal together when the last one lands, which removes the tabletop's going-last advantage. */
export function submitClue(state: RoundState, playerId: PlayerId, raw: string): RoundState {
  if (state.phase !== "clues") reject("WRONG_PHASE", "Clues are closed.");
  requirePlayer(state, playerId);
  if (state.clues[playerId]) reject("ALREADY_DONE", "You have already given a clue.");

  const clues = { ...state.clues, [playerId]: validateClue(state, raw) };
  const everyone = state.players.every((p) => clues[p]);
  return everyone
    ? { ...state, clues, phase: "discuss", deadlineAt: null }
    : { ...state, clues };
}

/** The clue timer ran out. Whoever did not answer is skipped, so a locked phone cannot stall the table. */
export function expireClues(state: RoundState): RoundState {
  if (state.phase !== "clues") return state;
  const skipped = state.players.filter((p) => !state.clues[p]);
  return { ...state, phase: "discuss", deadlineAt: null, skipped };
}

/** Recomputed from when clues opened, never from now, so nudging the setting cannot extend the phase. */
export function setClueSeconds(state: RoundState, seconds: number): RoundState {
  if (state.phase !== "clues") return state;
  return { ...state, deadlineAt: state.cluesStartedAt + seconds * 1000 };
}

export const cluesOutstanding = (state: RoundState): number =>
  state.players.filter((p) => !state.clues[p]).length;

/** Any player, not just the host: at a table somebody just says "okay, vote". */
export function callVote(state: RoundState, playerId: PlayerId): RoundState {
  if (state.phase !== "discuss") reject("WRONG_PHASE", "There is nothing to vote on yet.");
  requirePlayer(state, playerId);
  return {
    ...state,
    phase: "vote",
    voteOpen: true,
    votes: {},
    pending: [...state.players],
    candidates: null,
    revoted: false,
    tieVotes: 0,
    deadlineAt: null,
  };
}

const settle = (state: RoundState, voter: PlayerId): RoundState => {
  const next = { ...state, pending: state.pending.filter((p) => p !== voter) };
  return next.pending.length === 0 ? resolveVote(next) : next;
};

const requirePending = (state: RoundState, voter: PlayerId) => {
  if (state.phase !== "vote") reject("WRONG_PHASE", "The vote is not open.");
  requirePlayer(state, voter);
  if (!state.pending.includes(voter)) reject("ALREADY_DONE", "Your vote is already locked in.");
};

/** Locks a vote in. The tap that picks a name is the client's; only the lock-in reaches here. */
export function castVote(state: RoundState, voter: PlayerId, target: PlayerId): RoundState {
  requirePending(state, voter);
  if (!state.players.includes(target)) reject("NOT_PLAYING", "They are not in this round.");
  if (voter === target) reject("SELF_VOTE", "You cannot vote for yourself.");
  if (state.candidates && !state.candidates.includes(target)) {
    reject("NOT_PLAYING", "Only the tied players are up for it.");
  }
  return settle({ ...state, votes: { ...state.votes, [voter]: target } }, voter);
}

/** In a revote, standing by the vote you already cast. */
export function stayPut(state: RoundState, voter: PlayerId): RoundState {
  requirePending(state, voter);
  if (!state.candidates || !state.votes[voter]) reject("WRONG_PHASE", "You have no earlier vote to keep.");
  return settle(state, voter);
}

/** Raw counts of every locked vote. */
export function tally(state: RoundState): Record<PlayerId, number> {
  const counts: Record<PlayerId, number> = {};
  for (const p of state.players) counts[p] = 0;
  for (const target of Object.values(state.votes)) counts[target] += 1;
  return counts;
}

const girgitWalks = (state: RoundState): RoundState => ({
  ...state,
  phase: "reveal",
  voteOpen: false,
  pending: [],
  accused: null,
  deadlineAt: null,
  outcome: "girgit-escaped",
});

/**
 * Plurality among the players the ballot was about. A split gets one revote per round.
 * A dead heat (every player with a vote is tied) wipes the ballot and everyone votes again.
 * A partial split locks the votes already on a tied player; everyone else may move to one of the
 * tied players or stand by their vote. A second split lets the Girgit walk.
 */
export function resolveVote(state: RoundState): RoundState {
  const counts = tally(state);
  const pool = state.candidates ?? state.players;
  const top = Math.max(0, ...pool.map((p) => counts[p]));
  const leaders = pool.filter((p) => counts[p] === top);

  if (top > 0 && leaders.length === 1) {
    const accused = leaders[0];
    const settled = { ...state, voteOpen: false, pending: [], accused, deadlineAt: null };
    return accused === state.girgit
      ? { ...settled, phase: "escape" }
      : { ...settled, phase: "reveal", outcome: "girgit-escaped" };
  }

  if (state.revoted || top === 0) return girgitWalks(state);

  const voted = state.players.filter((p) => counts[p] > 0);
  if (leaders.length === voted.length) {
    return {
      ...state,
      votes: {},
      pending: [...state.players],
      candidates: null,
      revoted: true,
      tieVotes: top,
    };
  }
  return {
    ...state,
    pending: state.players.filter((p) => !leaders.includes(state.votes[p])),
    candidates: leaders,
    revoted: true,
    tieVotes: top,
  };
}

/** A caught Girgit's one shot at the word. */
export function submitEscape(state: RoundState, playerId: PlayerId, cellIndex: number): RoundState {
  if (state.phase !== "escape") reject("WRONG_PHASE", "There is no guess to make.");
  if (playerId !== state.girgit) reject("NOT_PLAYING", "Only the Girgit guesses.");
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= GRID_SIZE) {
    reject("INTERNAL", "That is not a cell.");
  }
  return {
    ...state,
    phase: "reveal",
    deadlineAt: null,
    escapeGuess: cellIndex,
    outcome: cellIndex === state.secretIndex ? "girgit-guessed" : "girgit-caught",
  };
}

/** For when somebody has genuinely gone home. No score. */
export function abortRound(state: RoundState): RoundState {
  return { ...state, phase: "reveal", deadlineAt: null, outcome: "aborted" };
}

export function scoreRound(state: RoundState): Record<PlayerId, number> {
  const delta: Record<PlayerId, number> = {};
  for (const p of state.players) delta[p] = 0;

  switch (state.outcome) {
    case "girgit-escaped":
      delta[state.girgit] = SCORE_GIRGIT_ESCAPED;
      break;
    case "girgit-guessed":
      delta[state.girgit] = SCORE_GIRGIT_GUESSED;
      break;
    case "girgit-caught":
      for (const p of state.players) if (p !== state.girgit) delta[p] = SCORE_INNOCENT;
      break;
    case "aborted":
    case null:
      break;
  }
  return delta;
}
