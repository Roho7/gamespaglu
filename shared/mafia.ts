/** Mafia's half of the wire contract. Types, constants and the role table. */
import type { PlayerId } from "./ids";

export const MAFIA_MIN_PLAYERS = 5;
export const MAFIA_MAX_PLAYERS = 12;

export const SCORE_MAFIA_WIN = 1;

export type MafiaRole = "mafia" | "doctor" | "detective" | "villager";
export type MafiaSide = "town" | "mafia";
export type MafiaPhase = "night" | "day" | "vote" | "verdict" | "over";
export type MafiaOutcome = MafiaSide | "aborted";
export type MafiaFate = "killed" | "voted" | "left";

/** A vote for nobody. A tie, or this winning, sends nobody out. */
export const NO_ONE = "no-one";
export type VoteTarget = PlayerId | typeof NO_ONE;

export type MafiaSettings = Record<string, never>;
export const DEFAULT_MAFIA_SETTINGS: MafiaSettings = {};

export type RoleMix = Record<MafiaRole, number>;

/** The roles a table of `players` is dealt. Fixed by headcount; there are no settings. */
export function roleMix(players: number): RoleMix {
  const mafia = players <= 6 ? 1 : players <= 9 ? 2 : 3;
  return { mafia, doctor: 1, detective: 1, villager: Math.max(0, players - mafia - 2) };
}

export const sideOf = (role: MafiaRole): MafiaSide => (role === "mafia" ? "mafia" : "town");

export type MafiaAction =
  | { type: "night:pick"; targetId: PlayerId }
  | { type: "night:end" }
  | { type: "vote:call" }
  | { type: "vote:cast"; targetId: VoteTarget }
  | { type: "vote:close" }
  | { type: "night:fall" };

export type Ballot<T = PlayerId> = { voterId: PlayerId; targetId: T };

export type MafiaNightRecord = {
  kind: "night";
  night: number;
  kill: PlayerId | null;
  save: PlayerId | null;
  check: PlayerId | null;
  died: PlayerId | null;
  suspicions: Ballot[];
};

export type MafiaVoteRecord = {
  kind: "vote";
  day: number;
  ballots: Ballot<VoteTarget>[];
  out: PlayerId | null;
};

export type MafiaExitRecord = { kind: "exit"; playerId: PlayerId };

export type MafiaRecord = MafiaNightRecord | MafiaVoteRecord | MafiaExitRecord;

export type MafiaPublicPlayer = {
  id: PlayerId;
  name: string;
  alive: boolean;
  /** Null while the player is alive and the game is running. */
  role: MafiaRole | null;
  fate: MafiaFate | null;
};

export type MafiaPublicVote = {
  open: boolean;
  votesIn: number;
  total: number;
  votedBy: PlayerId[];
  /** Ballots and the outcome, once the vote has closed. */
  result: MafiaVoteRecord | null;
};

export type MafiaPublicRound = {
  roundNo: number;
  night: number;
  roster: MafiaPublicPlayer[];
  mix: RoleMix;
  /** Living players the current night or vote is still waiting on. A count, never names. */
  waitingOn: number;
  news: { night: number; died: PlayerId | null } | null;
  vote: MafiaPublicVote | null;
  outcome: MafiaOutcome | null;
  /** Every night and vote, including what each role chose. Only once the game is over. */
  replay: MafiaRecord[] | null;
};

export type DetectiveCheck = { night: number; targetId: PlayerId; isMafia: boolean };

/** The per-recipient half. Everything here is shown only inside the hold-to-reveal card. */
export type MafiaYourRound = {
  role: MafiaRole;
  alive: boolean;
  team: PlayerId[];
  teamPicks: { playerId: PlayerId; targetId: PlayerId | null }[];
  pick: PlayerId | null;
  vote: VoteTarget | null;
  checks: DetectiveCheck[];
  lastSave: PlayerId | null;
};
