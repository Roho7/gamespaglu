/**
 * Mafia rules. Pure: no sockets, no database, no clock, and the deal's randomness is injected, so a
 * whole game plays out in a unit test.
 */
import {
  MAFIA_MAX_PLAYERS,
  MAFIA_MIN_PLAYERS,
  NO_ONE,
  SCORE_MAFIA_WIN,
  roleMix,
  sideOf,
  type Ballot,
  type MafiaFate,
  type MafiaOutcome,
  type MafiaPhase,
  type MafiaRecord,
  type MafiaRole,
  type MafiaSide,
  type MafiaVoteRecord,
  type PlayerId,
  type VoteTarget,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { Rng, Seat } from "../game/module";
import { shuffle } from "../game/random";

export type MafiaState = {
  phase: MafiaPhase;
  /** Frozen at the deal, in seat order. Joiners wait for the next game. */
  players: PlayerId[];
  /** Kept so a player who leaves mid-game can still be named in the news and the replay. */
  names: Record<PlayerId, string>;
  roles: Record<PlayerId, MafiaRole>;
  /** Present only for players who are out. */
  fates: Record<PlayerId, MafiaFate>;
  /** The current night, and the day that follows it. */
  night: number;
  /** Tonight's picks. Anyone may change theirs until the night resolves. */
  picks: Record<PlayerId, PlayerId>;
  votes: Record<PlayerId, VoteTarget>;
  /** Who the Doctor saved last night; they cannot save the same player tonight. */
  lastSave: PlayerId | null;
  records: MafiaRecord[];
  outcome: MafiaOutcome | null;
};

export const isAlive = (state: MafiaState, id: PlayerId) =>
  state.players.includes(id) && !state.fates[id];

export const living = (state: MafiaState) => state.players.filter((p) => !state.fates[p]);

export const livingWith = (state: MafiaState, role: MafiaRole) =>
  living(state).filter((p) => state.roles[p] === role);

export function dealMafia(seats: Seat[], rng: Rng): MafiaState {
  const players = seats.map((s) => s.id);
  if (players.length < MAFIA_MIN_PLAYERS) {
    reject("NOT_ENOUGH_PLAYERS", `Mafia needs at least ${MAFIA_MIN_PLAYERS} players.`);
  }
  if (players.length > MAFIA_MAX_PLAYERS) {
    reject("ROOM_FULL", `Mafia takes at most ${MAFIA_MAX_PLAYERS} players.`);
  }
  const mix = roleMix(players.length);
  const deck: MafiaRole[] = [
    ...Array<MafiaRole>(mix.mafia).fill("mafia"),
    "doctor",
    ...Array<MafiaRole>(mix.villager).fill("villager"),
  ];
  const order = shuffle(players, rng);
  const roles: Record<PlayerId, MafiaRole> = {};
  order.forEach((p, i) => (roles[p] = deck[i]));

  return {
    phase: "night",
    players,
    names: Object.fromEntries(seats.map((s) => [s.id, s.name])),
    roles,
    fates: {},
    night: 1,
    picks: {},
    votes: {},
    lastSave: null,
    records: [],
    outcome: null,
  };
}

function requireAlive(state: MafiaState, id: PlayerId) {
  if (!state.players.includes(id)) reject("NOT_PLAYING", "You are not in this game.");
  if (state.fates[id]) reject("NOT_PLAYING", "You're out. Ghosts don't get a say.");
}

const requirePhase = (state: MafiaState, phase: MafiaPhase, message: string) => {
  if (state.phase !== phase) reject("WRONG_PHASE", message);
};

/** The target every living Mafia has picked, or null while they disagree or someone has not picked. */
export function agreedKill(state: MafiaState): PlayerId | null {
  const targets = livingWith(state, "mafia").map((p) => state.picks[p]);
  if (targets.length === 0 || targets.some((t) => !t)) return null;
  return targets.every((t) => t === targets[0]) ? targets[0] : null;
}

/** Living players the night still waits on. A Mafia is done only once their team agrees. */
export function nightOutstanding(state: MafiaState): PlayerId[] {
  const agreed = agreedKill(state) !== null;
  return living(state).filter(
    (p) => !state.picks[p] || (state.roles[p] === "mafia" && !agreed),
  );
}

export const voteOutstanding = (state: MafiaState): PlayerId[] =>
  living(state).filter((p) => !state.votes[p]);

export function winner(state: MafiaState): MafiaSide | null {
  const mafia = livingWith(state, "mafia").length;
  const town = living(state).length - mafia;
  if (mafia === 0) return "town";
  return mafia >= town ? "mafia" : null;
}

function settle(state: MafiaState, next: MafiaPhase): MafiaState {
  const won = winner(state);
  return won ? { ...state, phase: "over", outcome: won } : { ...state, phase: next };
}

function refusePick(state: MafiaState, picker: PlayerId, target: PlayerId) {
  switch (state.roles[picker]) {
    case "mafia":
      if (state.roles[target] === "mafia") reject("BAD_TARGET", "That's family. Pick someone else.");
      break;
    case "doctor":
      if (target === state.lastSave) reject("BAD_TARGET", "You saved them last night. Spread the love.");
      break;
    case "villager":
      if (target === picker) reject("BAD_TARGET", "Pick someone who isn't you.");
      break;
  }
}

/** Every living player picks every night, whatever their role, so tapping a phone gives nothing away. */
export function pickAtNight(state: MafiaState, picker: PlayerId, target: PlayerId): MafiaState {
  requirePhase(state, "night", "It isn't night yet.");
  requireAlive(state, picker);
  if (!isAlive(state, target)) reject("BAD_TARGET", "They're already out. Pick someone with a pulse.");
  refusePick(state, picker, target);
  const next = { ...state, picks: { ...state.picks, [picker]: target } };
  return nightOutstanding(next).length === 0 ? resolveNight(next) : next;
}

/** Host only, for a phone locked in a pocket. Whatever was not picked resolves as nothing. */
export function endNight(state: MafiaState, isHost: boolean): MafiaState {
  requirePhase(state, "night", "It isn't night yet.");
  if (!isHost) reject("NOT_HOST", "Only the host can wake the town.");
  return resolveNight(state);
}

function pickOf(state: MafiaState, role: MafiaRole): PlayerId | null {
  const by = livingWith(state, role)[0];
  return by ? (state.picks[by] ?? null) : null;
}

export function resolveNight(state: MafiaState): MafiaState {
  const kill = agreedKill(state);
  const save = pickOf(state, "doctor");
  const died = kill && kill !== save ? kill : null;
  const suspicions: Ballot[] = livingWith(state, "villager")
    .filter((p) => state.picks[p])
    .map((p) => ({ voterId: p, targetId: state.picks[p] }));

  return settle(
    {
      ...state,
      fates: died ? { ...state.fates, [died]: "killed" } : state.fates,
      picks: {},
      lastSave: save,
      records: [
        ...state.records,
        { kind: "night", night: state.night, kill, save, died, suspicions },
      ],
    },
    "day",
  );
}

/** Any living player, when the table is ready. There is no discussion timer. */
export function callVote(state: MafiaState, caller: PlayerId): MafiaState {
  requirePhase(state, "day", "No trial yet. Talk first.");
  requireAlive(state, caller);
  return { ...state, phase: "vote", votes: {} };
}

export function castVote(state: MafiaState, voter: PlayerId, target: VoteTarget): MafiaState {
  requirePhase(state, "vote", "The polls aren't open.");
  requireAlive(state, voter);
  if (target === voter) reject("SELF_VOTE", "Voting for yourself? Bold. Not allowed.");
  if (target !== NO_ONE && !isAlive(state, target)) {
    reject("BAD_TARGET", "They're already gone. Pick someone with a pulse.");
  }
  if (state.votes[voter]) reject("ALREADY_DONE", "You already voted. No take-backs.");
  const next = { ...state, votes: { ...state.votes, [voter]: target } };
  return voteOutstanding(next).length === 0 ? resolveVote(next) : next;
}

/** Host only. Missing ballots simply do not count. */
export function closeVote(state: MafiaState, isHost: boolean): MafiaState {
  requirePhase(state, "vote", "The polls aren't open.");
  if (!isHost) reject("NOT_HOST", "Only the host can close the polls.");
  return resolveVote(state);
}

/** Plurality. A tie, no ballots, or No one winning sends nobody out. There is no run-off. */
export function resolveVote(state: MafiaState): MafiaState {
  const ballots: Ballot<VoteTarget>[] = state.players
    .filter((p) => state.votes[p])
    .map((p) => ({ voterId: p, targetId: state.votes[p] }));
  const counts = new Map<VoteTarget, number>();
  for (const b of ballots) counts.set(b.targetId, (counts.get(b.targetId) ?? 0) + 1);
  const top = Math.max(0, ...counts.values());
  const leaders = [...counts].filter(([, n]) => n === top).map(([t]) => t);
  const out = top > 0 && leaders.length === 1 && leaders[0] !== NO_ONE ? leaders[0] : null;
  const record: MafiaVoteRecord = { kind: "vote", day: state.night, ballots, out };

  return settle(
    {
      ...state,
      fates: out ? { ...state.fates, [out]: "voted" } : state.fates,
      votes: {},
      records: [...state.records, record],
    },
    "verdict",
  );
}

/** Any living player, once the table has finished reacting to the verdict. */
export function fallNight(state: MafiaState, caller: PlayerId): MafiaState {
  requirePhase(state, "verdict", "The verdict isn't in yet.");
  requireAlive(state, caller);
  return { ...state, phase: "night", night: state.night + 1, picks: {} };
}

const without = <V>(xs: Record<PlayerId, V>, gone: PlayerId): Record<PlayerId, V> =>
  Object.fromEntries(Object.entries(xs).filter(([k, v]) => k !== gone && v !== gone));

/**
 * Leaving mid-game is going out: the role is revealed and the win check runs. Any pick or ballot by
 * or for them is dropped, and the phase resolves if they were the last one it waited on.
 */
export function removePlayer(state: MafiaState, gone: PlayerId): MafiaState {
  if (state.phase === "over" || !isAlive(state, gone)) return state;
  const next = settle(
    {
      ...state,
      fates: { ...state.fates, [gone]: "left" },
      picks: without(state.picks, gone),
      votes: without(state.votes, gone),
      records: [...state.records, { kind: "exit", playerId: gone }],
    },
    state.phase,
  );
  if (next.phase === "night" && nightOutstanding(next).length === 0) return resolveNight(next);
  if (next.phase === "vote" && voteOutstanding(next).length === 0) return resolveVote(next);
  return next;
}

export function abortGame(state: MafiaState): MafiaState {
  return state.phase === "over" ? state : { ...state, phase: "over", outcome: "aborted" };
}

/** Everyone on the winning side scores, the dead included: dying for the town is still winning. */
export function scoreGame(state: MafiaState): Record<PlayerId, number> {
  const won = state.outcome;
  return Object.fromEntries(
    state.players.map((p) => [
      p,
      won !== null && won !== "aborted" && sideOf(state.roles[p]) === won ? SCORE_MAFIA_WIN : 0,
    ]),
  );
}
