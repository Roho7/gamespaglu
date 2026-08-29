/**
 * Girgit rules. Pure TypeScript: no sockets, no database, no React, no clock.
 *
 * Every function takes state and returns new state, so a whole session can be
 * played in a unit test with no server running — which is the point. It also
 * means the rules can be reasoned about on their own, and a second game
 * (Codenames) can sit beside this file rather than inside it.
 *
 * Randomness is injected. `Math.random` never appears here, because a rule you
 * cannot replay is a rule you cannot test.
 */
import {
  GRID_SIZE,
  MAX_CLUE_LENGTH,
  MAX_CLUE_WORDS,
  MIN_PLAYERS,
  SCORE_GIRGIT_ESCAPED,
  SCORE_GIRGIT_GUESSED,
  SCORE_INNOCENT,
  type ErrorCode,
  type PlayerId,
  type RoomPhase,
} from "../../../shared/protocol";

export type Rng = () => number;
/** Injected like the rng, and for the same reason: a rule with a hidden clock cannot be tested. */
export type Now = () => number;

export type Grid = {
  id: string;
  /** Which word pack it belongs to. Rooms choose which packs are in play. */
  pack: string;
  /** Public — including to the Girgit. Without it they cannot bluff at all. */
  theme: string;
  /** Exactly GRID_SIZE entry ids. */
  cells: string[];
};

export type Outcome =
  | "girgit-escaped"
  | "girgit-guessed"
  | "girgit-caught"
  | "aborted";

export type RoundState = {
  phase: RoomPhase;
  /** Frozen at the deal. A round is never redealt under the people playing it. */
  players: PlayerId[];
  girgit: PlayerId;
  gridId: string;
  theme: string;
  /** Cell contents in their shuffled positions. */
  cells: string[];
  secretIndex: number;
  clues: Record<PlayerId, string>;
  /**
   * Epoch ms the CLUE phase expires. Only the clue phase is timed — see
   * CLUE_SECONDS_OPTIONS for why the vote and the guess are not.
   */
  deadlineAt: number | null;
  /**
   * When clues opened. The deadline is derived from this rather than stored
   * alone, so changing the room's timer mid-round recomputes from the start of
   * the phase instead of restarting the clock.
   */
  cluesStartedAt: number;
  /** Ran out of time. Recorded so the reveal can say what happened. */
  skipped: PlayerId[];
  voteOpen: boolean;
  votes: Record<PlayerId, PlayerId>;
  accused: PlayerId | null;
  escapeGuess: number | null;
  outcome: Outcome | null;
};

export class RuleError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}
const reject = (code: ErrorCode, message: string): never => {
  throw new RuleError(code, message);
};

// ------------------------------------------------------------------ deal ---

/** Fisher-Yates against the injected rng. */
export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function dealRound(
  players: PlayerId[],
  grid: Grid,
  rng: Rng,
  now: Now,
  clueSeconds: number,
): RoundState {
  if (players.length < MIN_PLAYERS) {
    reject("NOT_ENOUGH_PLAYERS", `Girgit needs at least ${MIN_PLAYERS} players.`);
  }
  if (grid.cells.length !== GRID_SIZE) {
    reject("INTERNAL", `A grid must have exactly ${GRID_SIZE} cells.`);
  }

  return {
    phase: "clues",
    players: [...players],
    // Re-randomised every round rather than rotated: rotation lets people count.
    girgit: players[Math.floor(rng() * players.length)],
    gridId: grid.id,
    theme: grid.theme,
    // Positions are reshuffled each round so a grid cannot be learnt by layout.
    cells: shuffle(grid.cells, rng),
    secretIndex: Math.floor(rng() * GRID_SIZE),
    clues: {},
    cluesStartedAt: now(),
    deadlineAt: now() + clueSeconds * 1000,
    skipped: [],
    voteOpen: false,
    votes: {},
    accused: null,
    escapeGuess: null,
    outcome: null,
  };
}

/**
 * What one player is allowed to know. The Girgit gets `null` — this is the
 * whole secret, and it never leaves the server in any other shape.
 */
export function dealFor(state: RoundState, playerId: PlayerId) {
  return {
    theme: state.theme,
    cells: state.cells,
    isGirgit: playerId === state.girgit,
    secretIndex: playerId === state.girgit ? null : state.secretIndex,
  };
}

// ----------------------------------------------------------------- clues ---

const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** True when `needle` appears in `haystack` as a whole word, case-insensitively. */
export function containsWord(haystack: string, needle: string): boolean {
  return new RegExp(`\\b${escapeRe(needle)}\\b`, "i").test(haystack);
}

export function normaliseClue(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function validateClue(state: RoundState, raw: string): string {
  const clue = normaliseClue(raw);
  if (!clue) reject("BAD_CLUE", "Type a clue first.");
  if (clue.length > MAX_CLUE_LENGTH) {
    reject("BAD_CLUE", `Keep it under ${MAX_CLUE_LENGTH} characters.`);
  }
  if (clue.split(" ").length > MAX_CLUE_WORDS) {
    reject("BAD_CLUE", `Two words at most.`);
  }
  // Whole-word, not equality and not raw substring.
  //
  // Equality is too weak: two words let you smuggle the secret in beside
  // another one ("Titanic ship"), and equality waves that through.
  //
  // Raw substring is too strong, and the deck proves it — "Up", "It" and "Us"
  // are all real film titles, so `includes()` would reject "syrup", "bitter"
  // and "focus" as giveaways. Rejecting an innocent's honest clue is worse
  // than letting a lazy one through, because the player cannot tell why.
  if (containsWord(clue, state.cells[state.secretIndex])) {
    reject("BAD_CLUE", "That gives the word away.");
  }
  return clue;
}

export function submitClue(
  state: RoundState,
  playerId: PlayerId,
  raw: string,
): RoundState {
  if (state.phase !== "clues") reject("WRONG_PHASE", "Clues are closed.");
  if (!state.players.includes(playerId)) reject("NOT_PLAYING", "You are not in this round.");
  if (state.clues[playerId]) reject("ALREADY_DONE", "You have already given a clue.");

  const clues = { ...state.clues, [playerId]: validateClue(state, raw) };
  // Reveal is simultaneous: nothing is visible until the last clue lands, which
  // is what removes the going-last advantage the tabletop game has.
  const everyone = state.players.every((p) => clues[p]);
  return everyone
    ? { ...state, clues, phase: "discuss", deadlineAt: null }
    : { ...state, clues };
}

/**
 * The clue timer ran out. Whoever did not answer is skipped rather than waited
 * on — a locked phone must not be able to stall the table indefinitely.
 */
export function expireClues(state: RoundState): RoundState {
  if (state.phase !== "clues") return state;
  const skipped = state.players.filter((p) => !state.clues[p]);
  return { ...state, phase: "discuss", deadlineAt: null, skipped };
}

/**
 * Change the room's clue timer, including mid-phase.
 *
 * Recomputed from when clues opened, never from now: restarting the clock on
 * every change would let anyone extend the phase indefinitely, and shortening
 * it should be able to end the phase immediately.
 */
export function setClueSeconds(state: RoundState, seconds: number): RoundState {
  if (state.phase !== "clues") return state;
  return { ...state, deadlineAt: state.cluesStartedAt + seconds * 1000 };
}

export const cluesOutstanding = (state: RoundState): number =>
  state.players.filter((p) => !state.clues[p]).length;

// ------------------------------------------------------------------ vote ---

/** Any player, not just the host — at a table somebody just says "okay, vote". */
export function callVote(state: RoundState, playerId: PlayerId): RoundState {
  if (state.phase !== "discuss") reject("WRONG_PHASE", "There is nothing to vote on yet.");
  if (!state.players.includes(playerId)) reject("NOT_PLAYING", "You are not in this round.");
  // Untimed on purpose. The table is talking; a clock here rushes the game.
  return { ...state, phase: "vote", voteOpen: true, votes: {}, deadlineAt: null };
}

export function castVote(
  state: RoundState,
  voter: PlayerId,
  target: PlayerId,
): RoundState {
  if (state.phase !== "vote") reject("WRONG_PHASE", "The vote is not open.");
  if (!state.players.includes(voter)) reject("NOT_PLAYING", "You are not in this round.");
  if (!state.players.includes(target)) reject("NOT_PLAYING", "They are not in this round.");
  if (voter === target) reject("SELF_VOTE", "You cannot vote for yourself.");
  if (state.votes[voter]) reject("ALREADY_DONE", "You have already voted.");

  const votes = { ...state.votes, [voter]: target };
  if (state.players.some((p) => !votes[p])) return { ...state, votes };
  return resolveVote({ ...state, votes });
}


export function tally(state: RoundState): Record<PlayerId, number> {
  const counts: Record<PlayerId, number> = {};
  for (const p of state.players) counts[p] = 0;
  for (const target of Object.values(state.votes)) counts[target] += 1;
  return counts;
}

/**
 * Plurality. A tie sends the room back to discussion and the vote can be called
 * again — it may loop, and that is fine: it is a verbal game and they will sort
 * it out. Forcing a resolution would decide the round on a coin toss.
 */
export function resolveVote(state: RoundState): RoundState {
  const counts = tally(state);
  const top = Math.max(0, ...Object.values(counts));
  const leaders = state.players.filter((p) => counts[p] === top);

  // Nobody voted, or no single leader. Back to arguing — they will call it
  // again. Deliberately not decided on a coin toss.
  if (top === 0 || leaders.length !== 1) {
    return { ...state, phase: "discuss", voteOpen: false, votes: {}, deadlineAt: null };
  }

  const accused = leaders[0];
  if (accused === state.girgit) {
    // Caught — but they get one shot at the word.
    // Also untimed: being caught and having to think is part of it.
    return { ...state, phase: "escape", voteOpen: false, accused, deadlineAt: null };
  }
  return {
    ...state,
    phase: "reveal",
    voteOpen: false,
    accused,
    deadlineAt: null,
    outcome: "girgit-escaped",
  };
}

// ---------------------------------------------------------------- escape ---

export function submitEscape(
  state: RoundState,
  playerId: PlayerId,
  cellIndex: number,
): RoundState {
  if (state.phase !== "escape") reject("WRONG_PHASE", "There is no guess to make.");
  if (playerId !== state.girgit) reject("NOT_PLAYING", "Only the Girgit guesses.");
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= GRID_SIZE) {
    reject("INTERNAL", "That is not a cell.");
  }
  const right = cellIndex === state.secretIndex;
  return {
    ...state,
    phase: "reveal",
    deadlineAt: null,
    escapeGuess: cellIndex,
    outcome: right ? "girgit-guessed" : "girgit-caught",
  };
}

/** Host escape hatch: somebody has genuinely gone home. No score, redeal. */
export function abortRound(state: RoundState): RoundState {
  return { ...state, phase: "reveal", deadlineAt: null, outcome: "aborted" };
}

// ----------------------------------------------------------------- score ---

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
      for (const p of state.players) {
        if (p !== state.girgit) delta[p] = SCORE_INNOCENT;
      }
      break;
    case "aborted":
    case null:
      break;
  }
  return delta;
}
