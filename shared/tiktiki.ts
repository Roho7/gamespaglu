/** Tiktiki's half of the wire contract. Types, constants, the place list and the score table. */
import type { PlayerId } from "./ids";

export const TIKTIKI_MIN_PLAYERS = 4;
export const TIKTIKI_MAX_PLAYERS = 12;

/** How many places each round puts on the table: the real one and eleven decoys. */
export const SUSPECT_COUNT = 12;

export const ROUND_MINUTES_OPTIONS = [6, 8, 10] as const;
export type RoundMinutes = (typeof ROUND_MINUTES_OPTIONS)[number];
export const DEFAULT_ROUND_MINUTES: RoundMinutes = 8;

/** Everyday places a whole table can picture. Each id is also its photo's file name. */
export const TIKTIKI_PLACES = [
  { id: "swimming-pool", name: "Swimming pool" },
  { id: "gym", name: "Gym" },
  { id: "laboratory", name: "Laboratory" },
  { id: "hospital", name: "Hospital" },
  { id: "classroom", name: "School classroom" },
  { id: "airport", name: "Airport" },
  { id: "train-station", name: "Train station" },
  { id: "beach", name: "Beach" },
  { id: "cinema", name: "Cinema" },
  { id: "restaurant-kitchen", name: "Restaurant kitchen" },
  { id: "supermarket", name: "Supermarket" },
  { id: "bank", name: "Bank" },
  { id: "police-station", name: "Police station" },
  { id: "temple", name: "Temple" },
  { id: "wedding", name: "Wedding" },
  { id: "cricket-stadium", name: "Cricket stadium" },
  { id: "library", name: "Library" },
  { id: "hotel", name: "Hotel" },
  { id: "office", name: "Office" },
  { id: "circus", name: "Circus" },
  { id: "spaceship", name: "Spaceship" },
  { id: "pirate-ship", name: "Pirate ship" },
  { id: "zoo", name: "Zoo" },
  { id: "petrol-pump", name: "Petrol pump" },
] as const;
export type PlaceId = (typeof TIKTIKI_PLACES)[number]["id"];
export const PLACE_IDS: PlaceId[] = TIKTIKI_PLACES.map((p) => p.id);

const PLACE_NAMES = Object.fromEntries(TIKTIKI_PLACES.map((p) => [p.id, p.name])) as Record<
  PlaceId,
  string
>;
export const placeName = (id: PlaceId): string => PLACE_NAMES[id];
/** The place as it reads mid-sentence: "the swimming pool". */
export const thePlace = (id: PlaceId): string => `the ${PLACE_NAMES[id].toLowerCase()}`;
export const isPlaceId = (v: unknown): v is PlaceId => PLACE_IDS.includes(v as PlaceId);

/** How the questioning ended. Every ending goes on to the Tiktiki's guess. */
export type TiktikiEnding = "caught" | "framed" | "clock";
export type TiktikiOutcome = TiktikiEnding | "aborted";

/** What the Tiktiki banks for each ending, before the guess. */
export const TIKTIKI_BASE_SCORE: Record<TiktikiEnding, number> = { caught: 0, clock: 2, framed: 3 };
export const SCORE_RIGHT_GUESS = 2;
/** The town scores only when it catches the Tiktiki and the Tiktiki then misses. */
export const SCORE_TOWN = 1;
export const SCORE_ACCUSER = 2;

export type TiktikiPhase = "questioning" | "accusation" | "guess" | "over";

export type TiktikiSettings = { roundMinutes: RoundMinutes };
export const DEFAULT_TIKTIKI_SETTINGS: TiktikiSettings = { roundMinutes: DEFAULT_ROUND_MINUTES };

export type TiktikiAction =
  | { type: "accuse"; targetId: PlayerId }
  | { type: "verdict"; guilty: boolean }
  | { type: "verdict:close" }
  | { type: "guess"; placeId: PlaceId };

export type TiktikiBallot = { voterId: PlayerId; guilty: boolean };

/** One trial. `ballots` is null while it is open; missing votes are counted as not guilty. */
export type TiktikiTrial = {
  accuserId: PlayerId;
  accusedId: PlayerId;
  votedBy: PlayerId[];
  total: number;
  ballots: TiktikiBallot[] | null;
  convicted: boolean | null;
};

export type TiktikiPublicRound = {
  roundNo: number;
  roster: { id: PlayerId; name: string; present: boolean }[];
  /** The twelve places on the table this round, the real one among them. */
  suspects: PlaceId[];
  firstAskerId: PlayerId;
  roundMs: number;
  /** Epoch ms the clock runs out. Null while it is paused for a trial or once questioning is over. */
  deadlineAt: number | null;
  /** What was left on the clock when it paused. */
  msLeft: number;
  /** Players who have used their one accusation this round. */
  accusers: PlayerId[];
  /** The open trial, or the last one, until the next trial or the end of the round. */
  trial: TiktikiTrial | null;
  ending: TiktikiEnding | null;
  /** Public once the questioning is over, so the table knows who is guessing. */
  tiktikiId: PlayerId | null;
  /** Public only once the round is over. */
  placeId: PlaceId | null;
  guessId: PlaceId | null;
  outcome: TiktikiOutcome | null;
  /** Points each player earned this round, once it is over. */
  points: Record<PlayerId, number> | null;
};

/** The per-recipient half. Shown only inside the hold-to-reveal card. */
export type TiktikiYourRound = {
  tiktiki: boolean;
  /** Null for the Tiktiki. */
  placeId: PlaceId | null;
  /** Your ballot in the open trial. */
  verdict: boolean | null;
};
