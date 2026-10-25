/**
 * Tiktiki rules. Pure: no sockets, no store, and the clock and the deal's randomness are injected,
 * so a whole round plays out in a unit test.
 */
import {
  PLACE_IDS,
  SCORE_ACCUSER,
  SCORE_RIGHT_GUESS,
  SCORE_TOWN,
  SUSPECT_COUNT,
  TIKTIKI_BASE_SCORE,
  TIKTIKI_MAX_PLAYERS,
  TIKTIKI_MIN_PLAYERS,
  type PlaceId,
  type PlayerId,
  type TiktikiBallot,
  type TiktikiEnding,
  type TiktikiOutcome,
  type TiktikiPhase,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { Rng, Seat } from "../game/module";
import { shuffle } from "../game/random";

export type Trial = {
  accuserId: PlayerId;
  accusedId: PlayerId;
  votes: Record<PlayerId, boolean>;
  convicted: boolean | null;
  ballots: TiktikiBallot[] | null;
};

export type TiktikiState = {
  phase: TiktikiPhase;
  /** Frozen at the deal, in seat order. Joiners wait for the next round. */
  players: PlayerId[];
  names: Record<PlayerId, string>;
  /** Players who left mid-round. Their seat stays in the roster so the reveal can still name them. */
  gone: PlayerId[];
  tiktikiId: PlayerId;
  placeId: PlaceId;
  suspects: PlaceId[];
  firstAskerId: PlayerId;
  roundMs: number;
  deadlineAt: number | null;
  msLeft: number;
  accusers: PlayerId[];
  trial: Trial | null;
  ending: TiktikiEnding | null;
  guessId: PlaceId | null;
  outcome: TiktikiOutcome | null;
  /** Places dealt earlier in this room, so a session runs through the pool before repeating. */
  usedPlaceIds: PlaceId[];
};

/** The next real place: unused this session if possible, and never the one just played. */
export function pickPlace(used: readonly PlaceId[], last: PlaceId | null, rng: Rng): PlaceId {
  const fresh = PLACE_IDS.filter((p) => !used.includes(p));
  const pool = fresh.length ? fresh : PLACE_IDS.filter((p) => p !== last);
  return pool[Math.floor(rng() * pool.length)];
}

export function dealTiktiki(
  seats: Seat[],
  roundMinutes: number,
  previous: TiktikiState | null,
  rng: Rng,
  now: number,
): TiktikiState {
  const players = seats.map((s) => s.id);
  if (players.length < TIKTIKI_MIN_PLAYERS) {
    reject("NOT_ENOUGH_PLAYERS", `Tiktiki needs at least ${TIKTIKI_MIN_PLAYERS} players.`);
  }
  if (players.length > TIKTIKI_MAX_PLAYERS) {
    reject("ROOM_FULL", `Tiktiki takes at most ${TIKTIKI_MAX_PLAYERS} players.`);
  }
  const used = previous && previous.usedPlaceIds.length < PLACE_IDS.length ? previous.usedPlaceIds : [];
  const placeId = pickPlace(used, previous?.placeId ?? null, rng);
  const decoys = shuffle(PLACE_IDS.filter((p) => p !== placeId), rng).slice(0, SUSPECT_COUNT - 1);
  const roundMs = roundMinutes * 60_000;

  return {
    phase: "questioning",
    players,
    names: Object.fromEntries(seats.map((s) => [s.id, s.name])),
    gone: [],
    tiktikiId: players[Math.floor(rng() * players.length)],
    placeId,
    suspects: shuffle([placeId, ...decoys], rng),
    firstAskerId: players[Math.floor(rng() * players.length)],
    roundMs,
    deadlineAt: now + roundMs,
    msLeft: roundMs,
    accusers: [],
    trial: null,
    ending: null,
    guessId: null,
    outcome: null,
    usedPlaceIds: [...used, placeId],
  };
}

export const present = (state: TiktikiState) => state.players.filter((p) => !state.gone.includes(p));

const isPresent = (state: TiktikiState, id: PlayerId) =>
  state.players.includes(id) && !state.gone.includes(id);

function requirePlaying(state: TiktikiState, id: PlayerId) {
  if (!isPresent(state, id)) reject("NOT_PLAYING", "You're not in this round. Next one's yours.");
}

const requirePhase = (state: TiktikiState, phase: TiktikiPhase, message: string) => {
  if (state.phase !== phase) reject("WRONG_PHASE", message);
};

/** Who votes in the open trial: everyone still here except the accused. */
export const jurors = (state: TiktikiState): PlayerId[] =>
  state.trial ? present(state).filter((p) => p !== state.trial?.accusedId) : [];

export const trialOutstanding = (state: TiktikiState): PlayerId[] =>
  jurors(state).filter((p) => state.trial?.votes[p] === undefined);

/** Questioning is over: go to the guess, or straight to the end if the Tiktiki has gone. */
function toGuess(state: TiktikiState, ending: TiktikiEnding): TiktikiState {
  const next = { ...state, ending, deadlineAt: null };
  return isPresent(state, state.tiktikiId)
    ? { ...next, phase: "guess" }
    : { ...next, phase: "over", outcome: ending };
}

/** Anyone, once a round. The clock stops while the table votes. */
export function accuse(state: TiktikiState, accuser: PlayerId, target: PlayerId, now: number): TiktikiState {
  requirePhase(state, "questioning", "Hold that thought. Nobody's taking questions right now.");
  requirePlaying(state, accuser);
  if (target === accuser) reject("SELF_VOTE", "Accusing yourself? That's a confession.");
  if (!isPresent(state, target)) reject("BAD_TARGET", "They're not at the table. Pick someone who is.");
  if (state.accusers.includes(accuser)) {
    reject("ALREADY_DONE", "You've had your shot. Let someone else point fingers.");
  }
  const next: TiktikiState = {
    ...state,
    phase: "accusation",
    accusers: [...state.accusers, accuser],
    msLeft: Math.max(0, (state.deadlineAt ?? now) - now),
    deadlineAt: null,
    trial: { accuserId: accuser, accusedId: target, votes: { [accuser]: true }, convicted: null, ballots: null },
  };
  return trialOutstanding(next).length === 0 ? resolveTrial(next, now) : next;
}

export function castVerdict(state: TiktikiState, voter: PlayerId, guilty: boolean, now: number): TiktikiState {
  requirePhase(state, "accusation", "There's no trial on.");
  requirePlaying(state, voter);
  if (voter === state.trial?.accusedId) reject("SELF_VOTE", "You don't get a say in your own trial.");
  if (state.trial?.votes[voter] !== undefined) reject("ALREADY_DONE", "You already voted. No take-backs.");
  const trial = state.trial as Trial;
  const next = { ...state, trial: { ...trial, votes: { ...trial.votes, [voter]: guilty } } };
  return trialOutstanding(next).length === 0 ? resolveTrial(next, now) : next;
}

/** Host only, for a phone asleep in a pocket. Missing votes count as not guilty. */
export function closeTrial(state: TiktikiState, isHost: boolean, now: number): TiktikiState {
  requirePhase(state, "accusation", "There's no trial on.");
  if (!isHost) reject("NOT_HOST", "Only the host can bang the gavel.");
  return resolveTrial(state, now);
}

/** Unanimous or nothing. A failed trial puts the clock back where it stopped. */
export function resolveTrial(state: TiktikiState, now: number): TiktikiState {
  const trial = state.trial as Trial;
  const ballots = jurors(state).map((p) => ({ voterId: p, guilty: trial.votes[p] === true }));
  const convicted = ballots.length > 0 && ballots.every((b) => b.guilty);
  const next = { ...state, trial: { ...trial, ballots, convicted } };
  if (convicted) return toGuess(next, trial.accusedId === state.tiktikiId ? "caught" : "framed");
  return { ...next, phase: "questioning", deadlineAt: now + state.msLeft };
}

/** The clock ran out with nobody convicted. */
export function expireClock(state: TiktikiState): TiktikiState {
  return state.phase === "questioning" ? toGuess({ ...state, msLeft: 0 }, "clock") : state;
}

/** The Tiktiki's one formal guess, from the twelve on the table. */
export function guessPlace(state: TiktikiState, guesser: PlayerId, placeId: PlaceId): TiktikiState {
  requirePhase(state, "guess", "Not yet. Keep your poker face on.");
  if (guesser !== state.tiktikiId) reject("NOT_PLAYING", "You already know where you are. Act natural.");
  if (!state.suspects.includes(placeId)) reject("BAD_TARGET", "That place isn't on the table.");
  return { ...state, phase: "over", guessId: placeId, outcome: state.ending };
}

/** A player who leaves mid-round keeps the round going: their vote is dropped and nothing ends early. */
export function removePlayer(state: TiktikiState, gone: PlayerId): TiktikiState {
  if (state.phase === "over" || !isPresent(state, gone)) return state;
  const next = { ...state, gone: [...state.gone, gone] };
  if (next.phase === "guess" && gone === state.tiktikiId) return { ...next, phase: "over", outcome: state.ending };
  if (!next.trial || next.phase !== "accusation") return next;
  const votes = Object.fromEntries(Object.entries(next.trial.votes).filter(([p]) => p !== gone));
  return { ...next, trial: { ...next.trial, votes } };
}

export function abortRound(state: TiktikiState): TiktikiState {
  return state.phase === "over" ? state : { ...state, phase: "over", deadlineAt: null, outcome: "aborted" };
}

export const guessedRight = (state: TiktikiState) => state.guessId === state.placeId;

/** See TIKTIKI_BASE_SCORE. The town scores only for a catch the Tiktiki can't talk their way out of. */
export function scoreRound(state: TiktikiState): Record<PlayerId, number> {
  const ending = state.outcome === "aborted" ? null : state.ending;
  const right = guessedRight(state);
  const townWins = ending === "caught" && !right;
  return Object.fromEntries(
    state.players.map((p) => {
      if (!ending) return [p, 0];
      if (p === state.tiktikiId) return [p, TIKTIKI_BASE_SCORE[ending] + (right ? SCORE_RIGHT_GUESS : 0)];
      if (!townWins) return [p, 0];
      return [p, p === state.trial?.accuserId ? SCORE_ACCUSER : SCORE_TOWN];
    }),
  );
}
