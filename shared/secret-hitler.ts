import type { PlayerId } from "./ids";

export const SH_MIN_PLAYERS = 5;
export const SH_MAX_PLAYERS = 10;
export const LIBERAL_TO_WIN = 5;
export const FASCIST_TO_WIN = 6;
export const HITLER_ZONE = 3;
export const VETO_AT = 5;
export const CHAOS_AT = 3;
export const SCORE_SH_WIN = 1;

export type ShRole = "liberal" | "fascist" | "hitler";
export type ShParty = "liberal" | "fascist";
export type Policy = ShParty;
export type ShPower = "investigate" | "special-election" | "peek" | "execute";

/**
 * `nominate`: the President picks a Chancellor. `vote`: everyone alive votes.
 * `president` / `chancellor`: the Legislative Session, each holding their tiles.
 * `veto`: the Chancellor asked to veto and the President decides. `power`: the President owes a power.
 */
export type ShPhase = "nominate" | "vote" | "president" | "chancellor" | "veto" | "power" | "over";

export type ShWin = "liberal-policies" | "hitler-executed" | "fascist-policies" | "hitler-elected";
export type ShOutcome = { winner: ShParty; reason: ShWin } | { winner: null; reason: "aborted" };

export type ShSettings = Record<string, never>;
export const DEFAULT_SH_SETTINGS: ShSettings = {};

export type ShAction =
  | { type: "nominate"; targetId: PlayerId }
  | { type: "vote"; ja: boolean }
  | { type: "discard"; index: number }
  | { type: "enact"; index: number }
  | { type: "veto" }
  | { type: "veto:answer"; agree: boolean }
  | { type: "investigate"; targetId: PlayerId }
  | { type: "special-election"; targetId: PlayerId }
  | { type: "peek:done" }
  | { type: "execute"; targetId: PlayerId };

export type ShRoleMix = { liberal: number; fascist: number; hitler: 1 };

/** The deal for a table of `players`, from the rulebook's table. Throws nothing; the caller checks the range. */
export function shRoleMix(players: number): ShRoleMix {
  const liberal = Math.floor(players / 2) + 1;
  return { liberal, fascist: players - liberal - 1, hitler: 1 };
}

export type ShBoard = "small" | "medium" | "large";

/** The power under each of the first five Fascist slots. The sixth wins. */
export const FASCIST_BOARDS: Record<ShBoard, readonly (ShPower | null)[]> = {
  small: [null, null, "peek", "execute", "execute"],
  medium: [null, "investigate", "special-election", "execute", "execute"],
  large: ["investigate", "investigate", "special-election", "execute", "execute"],
};

export const boardFor = (players: number): ShBoard =>
  players <= 6 ? "small" : players <= 8 ? "medium" : "large";

export const partyOf = (role: ShRole): ShParty => (role === "liberal" ? "liberal" : "fascist");

export type ShPublicPlayer = {
  id: PlayerId;
  name: string;
  alive: boolean;
  /** Null until the game is over. */
  role: ShRole | null;
  /** Barred from the next Chancellorship by a term limit. */
  termLimited: boolean;
  investigated: boolean;
  /** Elected Chancellor after the third Fascist policy and survived it. */
  notHitler: boolean;
  /** Voted in the open election. Never how. */
  voted: boolean;
};

export type ShVoteResult = {
  president: PlayerId;
  chancellor: PlayerId;
  ballots: { voterId: PlayerId; ja: boolean }[];
  passed: boolean;
};

/** The last thing that happened, for the headline every phone prints. */
export type ShNews =
  | { kind: "dealt" }
  | { kind: "vote"; passed: boolean }
  | { kind: "enacted"; policy: Policy; chaos: boolean }
  | { kind: "vetoed"; chaos: Policy | null }
  | { kind: "veto-refused" }
  | { kind: "investigated"; targetId: PlayerId }
  | { kind: "special-election"; targetId: PlayerId }
  | { kind: "peeked" }
  | { kind: "executed"; targetId: PlayerId };

export type ShPublicRound = {
  roundNo: number;
  phase: ShPhase;
  roster: ShPublicPlayer[];
  board: ShBoard;
  liberal: number;
  fascist: number;
  tracker: number;
  deckCount: number;
  discardCount: number;
  president: PlayerId;
  /** The nominee, the sitting Chancellor, or null before a nomination. */
  chancellor: PlayerId | null;
  power: ShPower | null;
  vetoUnlocked: boolean;
  /** The Chancellor has asked for a veto this session. */
  vetoAsked: boolean;
  lastVote: ShVoteResult | null;
  news: ShNews;
  outcome: ShOutcome | null;
};

/** What only this player may see. */
export type ShYourRound = {
  role: ShRole;
  alive: boolean;
  /** Who your night phase showed you, with their roles. Empty for Liberals and for Hitler at 7 to 10. */
  knows: { playerId: PlayerId; role: ShRole }[];
  /** Your own vote in the open election. */
  vote: boolean | null;
  /** Your tiles: 3 as President, 2 as Chancellor, null otherwise. */
  hand: Policy[] | null;
  /** As Chancellor with veto unlocked and not yet refused this session. */
  canVeto: boolean;
  /** The top three tiles, while you hold a Policy Peek. */
  peek: Policy[] | null;
  /** Every Party Membership you have seen. */
  investigations: { playerId: PlayerId; party: ShParty }[];
};
