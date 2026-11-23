import {
  CHAOS_AT,
  FASCIST_BOARDS,
  FASCIST_TO_WIN,
  HITLER_ZONE,
  LIBERAL_TO_WIN,
  SCORE_SH_WIN,
  SH_MAX_PLAYERS,
  SH_MIN_PLAYERS,
  VETO_AT,
  boardFor,
  partyOf,
  shRoleMix,
  type PlayerId,
  type Policy,
  type ShAction,
  type ShNews,
  type ShOutcome,
  type ShPhase,
  type ShPower,
  type ShRole,
  type ShVoteResult,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { Rng, Seat } from "../game/module";
import { shuffle } from "../game/random";

/**
 * Secret Hitler as one reducer over plain data, implementing `RULES.md`. Randomness arrives as an
 * injected rng, so a seeded game replays exactly.
 */
export type ShState = {
  phase: ShPhase;
  /** Seat order, which is clockwise. Frozen at the deal. */
  players: PlayerId[];
  names: Record<PlayerId, string>;
  roles: Record<PlayerId, ShRole>;
  dead: PlayerId[];
  deck: Policy[];
  discard: Policy[];
  liberal: number;
  fascist: number;
  tracker: number;
  /** Seat index the presidency passes on from. A Special Election leaves it on the caller. */
  rotation: number;
  president: PlayerId;
  chancellor: PlayerId | null;
  /** The last elected government. Cleared by chaos. */
  termLimited: { president: PlayerId; chancellor: PlayerId } | null;
  votes: Record<PlayerId, boolean>;
  lastVote: ShVoteResult | null;
  hand: Policy[];
  vetoAsked: boolean;
  vetoRefused: boolean;
  power: ShPower | null;
  investigations: { by: PlayerId; target: PlayerId }[];
  notHitler: PlayerId[];
  news: ShNews;
  outcome: ShOutcome | null;
};

export const FRESH_DECK: readonly Policy[] = [
  ...Array<Policy>(6).fill("liberal"),
  ...Array<Policy>(11).fill("fascist"),
];

export const isAlive = (s: ShState, id: PlayerId) => s.players.includes(id) && !s.dead.includes(id);
export const living = (s: ShState) => s.players.filter((p) => !s.dead.includes(p));
export const vetoUnlocked = (s: ShState) => s.fascist >= VETO_AT;
export const hitlerOf = (s: ShState) => s.players.find((p) => s.roles[p] === "hitler")!;

/** Who each player's night phase shows them. */
export function nightKnowledge(s: ShState, id: PlayerId): PlayerId[] {
  const role = s.roles[id];
  if (role === "liberal") return [];
  const team = s.players.filter((p) => p !== id && s.roles[p] !== "liberal");
  if (role === "fascist") return team;
  return s.players.length <= 6 ? team : [];
}

export function eligibleChancellors(s: ShState): PlayerId[] {
  const limits = s.termLimited;
  const small = living(s).length <= 5;
  return living(s).filter(
    (p) =>
      p !== s.president &&
      p !== limits?.chancellor &&
      (small || p !== limits?.president),
  );
}

export function termLimitedNow(s: ShState): PlayerId[] {
  const limits = s.termLimited;
  if (!limits) return [];
  return living(s).length <= 5 ? [limits.chancellor] : [limits.president, limits.chancellor];
}

export const outstandingVotes = (s: ShState) => living(s).filter((p) => s.votes[p] === undefined);

export function dealSh(seats: Seat[], rng: Rng): ShState {
  const players = seats.map((s) => s.id);
  if (players.length < SH_MIN_PLAYERS) {
    reject("NOT_ENOUGH_PLAYERS", `Secret Hitler needs at least ${SH_MIN_PLAYERS} players.`);
  }
  if (players.length > SH_MAX_PLAYERS) {
    reject("ROOM_FULL", `Secret Hitler takes at most ${SH_MAX_PLAYERS} players.`);
  }
  const mix = shRoleMix(players.length);
  const cards: ShRole[] = [
    ...Array<ShRole>(mix.liberal).fill("liberal"),
    ...Array<ShRole>(mix.fascist).fill("fascist"),
    "hitler",
  ];
  const order = shuffle(players, rng);
  const roles: Record<PlayerId, ShRole> = {};
  order.forEach((p, i) => (roles[p] = cards[i]));
  const rotation = Math.floor(rng() * players.length);
  return {
    phase: "nominate",
    players,
    names: Object.fromEntries(seats.map((s) => [s.id, s.name])),
    roles,
    dead: [],
    deck: shuffle(FRESH_DECK, rng),
    discard: [],
    liberal: 0,
    fascist: 0,
    tracker: 0,
    rotation,
    president: players[rotation],
    chancellor: null,
    termLimited: null,
    votes: {},
    lastVote: null,
    hand: [],
    vetoAsked: false,
    vetoRefused: false,
    power: null,
    investigations: [],
    notHitler: [],
    news: { kind: "dealt" },
    outcome: null,
  };
}

function nextLivingSeat(s: ShState, from: number): number {
  for (let step = 1; step <= s.players.length; step++) {
    const i = (from + step) % s.players.length;
    if (isAlive(s, s.players[i])) return i;
  }
  return from;
}

function newRound(s: ShState): ShState {
  const rotation = nextLivingSeat(s, s.rotation);
  return {
    ...s,
    phase: "nominate",
    rotation,
    president: s.players[rotation],
    chancellor: null,
    votes: {},
    hand: [],
    vetoAsked: false,
    vetoRefused: false,
    power: null,
  };
}

const win = (s: ShState, outcome: ShOutcome): ShState => ({ ...s, phase: "over", outcome });

function reshuffled(s: ShState, rng: Rng): ShState {
  if (s.deck.length >= 3) return s;
  return { ...s, deck: shuffle([...s.deck, ...s.discard], rng), discard: [] };
}

function place(s: ShState, policy: Policy): ShState {
  return policy === "liberal"
    ? { ...s, liberal: s.liberal + 1, tracker: 0 }
    : { ...s, fascist: s.fascist + 1, tracker: 0 };
}

function policyWin(s: ShState): ShState | null {
  if (s.liberal >= LIBERAL_TO_WIN) return win(s, { winner: "liberal", reason: "liberal-policies" });
  if (s.fascist >= FASCIST_TO_WIN) return win(s, { winner: "fascist", reason: "fascist-policies" });
  return null;
}

/** Three failed governments in a row: the top tile goes straight onto the board, powers ignored. */
function chaos(s: ShState, rng: Rng): { state: ShState; policy: Policy } {
  const [policy, ...deck] = s.deck;
  const placed = place({ ...s, deck, termLimited: null }, policy);
  return { state: policyWin(placed) ?? reshuffled(placed, rng), policy };
}

function advanceTracker(s: ShState, rng: Rng, news: (chaos: Policy | null) => ShNews): ShState {
  const bumped = { ...s, tracker: s.tracker + 1 };
  if (bumped.tracker < CHAOS_AT) return newRound({ ...bumped, news: news(null) });
  const { state, policy } = chaos(bumped, rng);
  const told = { ...state, news: news(policy) };
  return told.phase === "over" ? told : newRound(told);
}

function enact(s: ShState, policy: Policy, rng: Rng): ShState {
  const placed = place({ ...s, hand: [], news: { kind: "enacted", policy, chaos: false } }, policy);
  const won = policyWin(placed);
  if (won) return won;
  const ready = reshuffled(placed, rng);
  const power = policy === "fascist" ? FASCIST_BOARDS[boardFor(s.players.length)][ready.fascist - 1] : null;
  return power ? { ...ready, phase: "power", power } : newRound(ready);
}

const requirePhase = (s: ShState, phase: ShPhase, message: string) => {
  if (s.phase !== phase) reject("WRONG_PHASE", message);
};

function requirePresident(s: ShState, by: PlayerId) {
  if (by !== s.president) reject("NOT_PLAYING", "That's the President's call.");
}

function requireTarget(s: ShState, by: PlayerId, target: PlayerId) {
  if (!isAlive(s, target)) reject("BAD_TARGET", "Pick someone still in the game.");
  if (target === by) reject("BAD_TARGET", "Pick someone other than yourself.");
}

function requirePower(s: ShState, by: PlayerId, power: ShPower) {
  requirePhase(s, "power", "No power to use right now.");
  requirePresident(s, by);
  if (s.power !== power) reject("WRONG_PHASE", "That isn't the power on the board.");
}

function requireIndex(hand: Policy[], index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= hand.length) {
    reject("BAD_ACTION", "Pick one of your tiles.");
  }
}

function nominate(s: ShState, by: PlayerId, target: PlayerId): ShState {
  requirePhase(s, "nominate", "Nominations are closed.");
  requirePresident(s, by);
  if (!eligibleChancellors(s).includes(target)) {
    reject("BAD_TARGET", "They can't be Chancellor this round.");
  }
  return { ...s, phase: "vote", chancellor: target, votes: {} };
}

function vote(s: ShState, by: PlayerId, ja: boolean, rng: Rng): ShState {
  requirePhase(s, "vote", "There's no vote open.");
  if (!isAlive(s, by)) reject("NOT_PLAYING", "The dead don't vote.");
  if (s.votes[by] !== undefined) reject("ALREADY_DONE", "Your vote is already in.");
  const voted = { ...s, votes: { ...s.votes, [by]: ja } };
  if (outstandingVotes(voted).length) return voted;

  const ballots = living(voted).map((voterId) => ({ voterId, ja: voted.votes[voterId] }));
  const jas = ballots.filter((b) => b.ja).length;
  const passed = jas * 2 > ballots.length;
  const chancellor = voted.chancellor!;
  const lastVote: ShVoteResult = { president: voted.president, chancellor, ballots, passed };
  const counted: ShState = { ...voted, lastVote, news: { kind: "vote", passed } };
  if (!passed) {
    return advanceTracker(counted, rng, (c) =>
      c ? { kind: "enacted", policy: c, chaos: true } : counted.news,
    );
  }

  const elected = { ...counted, termLimited: { president: counted.president, chancellor } };
  const zone = elected.fascist >= HITLER_ZONE;
  if (zone && elected.roles[chancellor] === "hitler") {
    return win(elected, { winner: "fascist", reason: "hitler-elected" });
  }
  return {
    ...elected,
    phase: "president",
    hand: elected.deck.slice(0, 3),
    deck: elected.deck.slice(3),
    notHitler: zone ? [...elected.notHitler, chancellor] : elected.notHitler,
  };
}

function discard(s: ShState, by: PlayerId, index: number): ShState {
  requirePhase(s, "president", "You're not holding three tiles.");
  requirePresident(s, by);
  requireIndex(s.hand, index);
  const hand = s.hand.filter((_, i) => i !== index);
  return { ...s, phase: "chancellor", hand, discard: [...s.discard, s.hand[index]] };
}

function requireChancellor(s: ShState, by: PlayerId) {
  requirePhase(s, "chancellor", "The Chancellor isn't holding tiles.");
  if (by !== s.chancellor) reject("NOT_PLAYING", "That's the Chancellor's call.");
}

function chancellorEnacts(s: ShState, by: PlayerId, index: number, rng: Rng): ShState {
  requireChancellor(s, by);
  requireIndex(s.hand, index);
  const tossed = s.hand.filter((_, i) => i !== index);
  return enact({ ...s, discard: [...s.discard, ...tossed] }, s.hand[index], rng);
}

function askVeto(s: ShState, by: PlayerId): ShState {
  requireChancellor(s, by);
  if (!vetoUnlocked(s)) reject("WRONG_PHASE", "Veto unlocks after the fifth Fascist policy.");
  if (s.vetoRefused) reject("ALREADY_DONE", "The President already said no. Enact one.");
  return { ...s, phase: "veto", vetoAsked: true };
}

function answerVeto(s: ShState, by: PlayerId, agree: boolean, rng: Rng): ShState {
  requirePhase(s, "veto", "Nobody asked for a veto.");
  requirePresident(s, by);
  if (!agree) return { ...s, phase: "chancellor", vetoRefused: true, news: { kind: "veto-refused" } };
  const binned = { ...s, discard: [...s.discard, ...s.hand], hand: [] };
  return advanceTracker(reshuffled(binned, rng), rng, (c) => ({ kind: "vetoed", chaos: c }));
}

function investigate(s: ShState, by: PlayerId, target: PlayerId): ShState {
  requirePower(s, by, "investigate");
  requireTarget(s, by, target);
  if (s.investigations.some((i) => i.target === target)) {
    reject("BAD_TARGET", "They've already been investigated. Nobody gets checked twice.");
  }
  return newRound({
    ...s,
    investigations: [...s.investigations, { by, target }],
    news: { kind: "investigated", targetId: target },
  });
}

function specialElection(s: ShState, by: PlayerId, target: PlayerId): ShState {
  requirePower(s, by, "special-election");
  requireTarget(s, by, target);
  return {
    ...s,
    phase: "nominate",
    president: target,
    chancellor: null,
    votes: {},
    power: null,
    news: { kind: "special-election", targetId: target },
  };
}

function peekDone(s: ShState, by: PlayerId): ShState {
  requirePower(s, by, "peek");
  return newRound({ ...s, news: { kind: "peeked" } });
}

function execute(s: ShState, by: PlayerId, target: PlayerId): ShState {
  requirePower(s, by, "execute");
  requireTarget(s, by, target);
  const shot = { ...s, dead: [...s.dead, target], news: { kind: "executed", targetId: target } as ShNews };
  if (s.roles[target] === "hitler") return win(shot, { winner: "liberal", reason: "hitler-executed" });
  return newRound(shot);
}

export function reduce(s: ShState, by: PlayerId, action: ShAction, rng: Rng): ShState {
  if (s.phase === "over") reject("WRONG_PHASE", "This game is over.");
  if (!s.players.includes(by)) reject("NOT_PLAYING", "You're not in this game.");
  switch (action.type) {
    case "nominate":
      return nominate(s, by, action.targetId);
    case "vote":
      return vote(s, by, action.ja, rng);
    case "discard":
      return discard(s, by, action.index);
    case "enact":
      return chancellorEnacts(s, by, action.index, rng);
    case "veto":
      return askVeto(s, by);
    case "veto:answer":
      return answerVeto(s, by, action.agree, rng);
    case "investigate":
      return investigate(s, by, action.targetId);
    case "special-election":
      return specialElection(s, by, action.targetId);
    case "peek:done":
      return peekDone(s, by);
    case "execute":
      return execute(s, by, action.targetId);
  }
}

export function abortSh(s: ShState): ShState {
  return s.phase === "over" ? s : win(s, { winner: null, reason: "aborted" });
}

/** One point to everyone on the winning side, the dead included. */
export function scoreSh(s: ShState): Record<PlayerId, number> {
  const winner = s.outcome?.winner;
  return Object.fromEntries(
    s.players.map((p) => [p, winner && partyOf(s.roles[p]) === winner ? SCORE_SH_WIN : 0]),
  );
}
