/** Girgit's half of the wire contract. Types and constants only. */
import type { PlayerId } from "./ids";

export const GIRGIT_MIN_PLAYERS = 4;
export const GIRGIT_MAX_PLAYERS = 10;

export const GRID_SIZE = 16;

/** One or two words; the character cap is what stops a clue drifting into a sentence. */
export const MAX_CLUE_WORDS = 2;
export const MAX_CLUE_LENGTH = 20;

/** Every pack must hold enough grids that a session does not repeat itself; `check:grids` enforces the floor. */
export const PACKS = [
  { id: "movies-tv", label: "Movies & TV" },
  { id: "people", label: "Famous people" },
  { id: "characters", label: "Characters" },
  { id: "brands", label: "Brands" },
  { id: "everyday", label: "Everyday things" },
  { id: "world", label: "Around the world" },
  { id: "culture", label: "Arts & culture" },
] as const;
export type PackId = (typeof PACKS)[number]["id"];
export const ALL_PACKS: PackId[] = PACKS.map((p) => p.id);

/** Only the clue phase is timed. The vote and the escape guess are moments the table talks through. */
export const CLUE_SECONDS_OPTIONS = [30, 60] as const;
export type ClueSeconds = (typeof CLUE_SECONDS_OPTIONS)[number];
export const DEFAULT_CLUE_SECONDS: ClueSeconds = 60;

export const SCORE_GIRGIT_ESCAPED = 2;
export const SCORE_GIRGIT_GUESSED = 1;
export const SCORE_INNOCENT = 1;

export type GirgitPhase = "clues" | "discuss" | "vote" | "escape" | "reveal";

export type GirgitOutcome =
  | "girgit-escaped"
  | "girgit-guessed"
  | "girgit-caught"
  | "aborted";

export type GirgitSettings = { clueSeconds: ClueSeconds; packs: PackId[] };

export const DEFAULT_GIRGIT_SETTINGS: GirgitSettings = {
  clueSeconds: DEFAULT_CLUE_SECONDS,
  packs: ALL_PACKS,
};

export type GirgitAction =
  | { type: "clue:submit"; word: string }
  | { type: "vote:call" }
  | { type: "vote:cast"; targetId: PlayerId }
  | { type: "escape:guess"; cellIndex: number };

export type GirgitPublicRound = {
  roundNo: number;
  theme: string;
  cells: string[];
  cluesIn: number;
  cluesTotal: number;
  clues: { playerId: PlayerId; word: string }[];
  votedBy: PlayerId[];
  voteCounts: Record<PlayerId, number>;
  deadlineAt: number | null;
  skipped: PlayerId[];
  voteOpen: boolean;
  votesIn: number;
  votes: { voterId: PlayerId; targetId: PlayerId }[] | null;
  accused: PlayerId | null;
  outcome: GirgitOutcome | null;
  girgitId: PlayerId | null;
  secretIndex: number | null;
  escapeGuess: number | null;
};

/** The per-recipient half. The Girgit's `secretIndex` is always null. */
export type GirgitYourRound = {
  isGirgit: boolean;
  secretIndex: number | null;
  hasClued: boolean;
  hasVoted: boolean;
};
