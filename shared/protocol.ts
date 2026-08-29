/**
 * The wire contract. Imported by BOTH the Next client and the socket server.
 *
 * This file exists because the commonest realtime bug is the two sides
 * disagreeing about an event name or a payload shape — and it fails silently,
 * at runtime, in a room, mid-game, in front of eight people. Keeping one
 * definition turns every one of those into a compile error.
 *
 * Types and constants only. No imports, no runtime dependencies: the server
 * compiles it to CommonJS and Next bundles it for the browser.
 */

/** Bumped when a change is not backward compatible. Client sends it on connect. */
export const PROTOCOL_VERSION = 1;

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 10;
export const MAX_NAME_LENGTH = 16;
export const ROOM_CODE_LENGTH = 4;

/**
 * No vowels. 21^4 is still 194,481 codes, and a code can never accidentally
 * spell a word — which, on a game people show to their friends, matters.
 */
export const ROOM_CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXYZ";

/** How long a room survives with nobody doing anything. */
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

export const GRID_SIZE = 16;

/**
 * One or two words. Not one: plenty of the best clues are naturally two ("red
 * carpet", "not real") and forcing a single word just produces hyphenation.
 * The character cap is what stops it drifting into a sentence.
 */
export const MAX_CLUE_WORDS = 2;
export const MAX_CLUE_LENGTH = 20;

/** Girgit not caught. */
/**
 * Only the clue phase is timed, and the room chooses how long.
 *
 * The vote and the escape guess are deliberately untimed: they are moments the
 * table is already talking through, and a clock on them rushes the part of the
 * game that is the game. The cost is real and is why `round:abort` exists — a
 * locked phone during the vote stalls the round, and the host has to end it.
 */
/**
 * Word packs. A room picks which of these are in play, so a group can have a
 * pop-culture night or keep it to things in a kitchen.
 *
 * Every pack must hold enough grids that a session does not repeat itself
 * immediately — `check:grids` enforces a floor, because a pack of one is a
 * setting that makes the game worse the moment anybody picks it.
 */
export const PACKS = [
  { id: "movies-tv", label: "Movies & TV" },
  { id: "people", label: "Famous people" },
  { id: "characters", label: "Characters" },
  { id: "brands", label: "Brands" },
  { id: "everyday", label: "Everyday things" },
] as const;
export type PackId = (typeof PACKS)[number]["id"];
export const ALL_PACKS: PackId[] = PACKS.map((p) => p.id);

export const CLUE_SECONDS_OPTIONS = [30, 60] as const;
export type ClueSeconds = (typeof CLUE_SECONDS_OPTIONS)[number];
export const DEFAULT_CLUE_SECONDS: ClueSeconds = 60;

export const SCORE_GIRGIT_ESCAPED = 2;
/** Caught, but guessed the secret word. */
export const SCORE_GIRGIT_GUESSED = 1;
/** Caught and guessed wrong — every innocent scores. */
export const SCORE_INNOCENT = 1;

export type DeviceId = string;
export type PlayerId = string;
export type RoomCode = string;
export type GameId = "girgit";

/**
 * M1 ships only the lobby. Round phases land in M3 — listed here so the client
 * switch is exhaustive from the start rather than growing a default case.
 */
export type RoomPhase =
  | "lobby"
  /** Everyone types one clue. Reveal is simultaneous. */
  | "clues"
  /** No app surface at all. The grid and the clues sit there; people talk. */
  | "discuss"
  | "vote"
  /** The caught Girgit gets one guess at the secret word. */
  | "escape"
  | "reveal";

export type PublicPlayer = {
  id: PlayerId;
  name: string;
  /** Stable seat order, so the round order does not shuffle when someone drops. */
  seat: number;
  /**
   * False means the socket is gone, NOT that the player left. Locking your
   * phone and putting it face-down while arguing is the single commonest thing
   * that happens at a table, and it must not end anyone's game.
   */
  connected: boolean;
  /** Leaving takes effect at the next round boundary, never mid-round. */
  pendingLeave: boolean;
  isHost: boolean;
  score: number;
};

export type Outcome =
  | "girgit-escaped"
  | "girgit-guessed"
  | "girgit-caught"
  | "aborted";

/** What everyone in the room may see. Never carries the secret mid-round. */
export type PublicRound = {
  roundNo: number;
  theme: string;
  cells: string[];
  cluesIn: number;
  cluesTotal: number;
  /**
   * Clues appear as they are written, not all at once at the end.
   *
   * This reverses the original design. Simultaneous reveal removed the
   * going-last advantage the tabletop game has, which is a real edge for the
   * Girgit — but playing it, the wait reads as the app being stuck, and a table
   * that cannot see the clue board filling up has nothing to talk about. Live
   * clues won on the strength of actually playing it.
   */
  clues: { playerId: PlayerId; word: string }[];
  /** Who has locked a vote in. */
  votedBy: PlayerId[];
  /** How many votes each player has received. Counts are public; targets are not. */
  voteCounts: Record<PlayerId, number>;
  /** Epoch ms the current phase expires, or null when nothing is timed. */
  deadlineAt: number | null;
  /** Players who ran out of time and were skipped. */
  skipped: PlayerId[];
  voteOpen: boolean;
  votesIn: number;
  /** Hidden while casting, fully attributed once resolved. */
  votes: { voterId: PlayerId; targetId: PlayerId }[] | null;
  accused: PlayerId | null;
  outcome: Outcome | null;
  /** All three null until the reveal. This is the secret. */
  girgitId: PlayerId | null;
  secretIndex: number | null;
  /** Which cell the caught Girgit picked, so the board can show both. */
  escapeGuess: number | null;
};

/**
 * The per-socket half. This is the entire reason this is a socket server and
 * not Supabase Realtime, whose broadcast is all-or-nothing to a channel.
 */
export type YourRound = {
  isGirgit: boolean;
  /** Null for the Girgit. Not omitted — the shape is identical either way. */
  secretIndex: number | null;
  /**
   * Your own action, echoed back. The public payload deliberately hides the
   * clue words and the vote targets until the reveal, which meant the UI could
   * not tell you whether your own tap had landed — the first thing real players
   * complained about.
   */
  hasClued: boolean;
  hasVoted: boolean;
};

export type RoomState = {
  code: RoomCode;
  game: GameId;
  phase: RoomPhase;
  roundNo: number;
  players: PublicPlayer[];
  hostId: PlayerId;
  /** Which of the players above is the recipient. */
  you: PlayerId;
  minPlayers: number;
  maxPlayers: number;
  /** How long the clue phase runs. A room setting, changeable mid-round. */
  clueSeconds: number;
  /** Which word packs are in play. Never empty. */
  packs: string[];
  round: PublicRound | null;
  your: YourRound | null;
};

export type ErrorCode =
  | "BAD_CODE"
  | "BAD_NAME"
  | "BAD_DEVICE"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "NAME_TAKEN"
  | "NOT_IN_ROOM"
  | "NOT_HOST"
  | "WRONG_PHASE"
  | "NOT_PLAYING"
  | "ALREADY_DONE"
  | "BAD_CLUE"
  | "SELF_VOTE"
  | "NOT_ENOUGH_PLAYERS"
  | "BAD_SETTING"
  | "PROTOCOL_MISMATCH"
  | "RATE_LIMITED"
  | "INTERNAL";

export type Err = { code: ErrorCode; message: string };

/** Acks carry failure in the value, so a rejection is never an unhandled throw. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: Err };
export type Ack<T> = (result: Result<T>) => void;

export type JoinedRoom = { code: RoomCode; playerId: PlayerId };

export type ClientToServer = {
  "room:create": (p: { deviceId: DeviceId; name: string }, ack: Ack<JoinedRoom>) => void;
  "room:join": (
    p: { deviceId: DeviceId; name: string; code: RoomCode },
    ack: Ack<JoinedRoom>,
  ) => void;
  /**
   * Reconnect after a reload, a lock screen, or a server redeploy. Distinct
   * from join: it takes no name and never creates a seat, so a resume for a
   * seat that is gone fails loudly instead of silently adding a stranger.
   */
  "room:resume": (p: { deviceId: DeviceId; code: RoomCode }, ack: Ack<JoinedRoom>) => void;
  /** Explicit departure. Applies at the next round boundary. */
  "room:leave": (p: Record<string, never>, ack: Ack<{ ok: true }>) => void;
  /** Host only. The escape hatch for someone who has actually gone home. */
  "room:kick": (p: { playerId: PlayerId }, ack: Ack<{ ok: true }>) => void;

  /**
   * Host only. Takes effect immediately, including mid-clue: the deadline is
   * recomputed from when the clue phase started, not from now, so shortening it
   * cannot hand anybody extra time by resetting the clock.
   */
  "room:clueSeconds": (p: { seconds: number }, ack: Ack<{ ok: true }>) => void;
  /** Host only. Applies to the next deal — the grid in play is already dealt. */
  "room:packs": (p: { packs: string[] }, ack: Ack<{ ok: true }>) => void;

  /** Host only. Applies queued joins and leaves, then deals. */
  "round:start": (p: Record<string, never>, ack: Ack<{ ok: true }>) => void;
  /**
   * Host only. For when a player has genuinely gone home mid-round — rather
   * than a timeout heuristic that cannot tell "left" from "in the bathroom".
   */
  "round:abort": (p: Record<string, never>, ack: Ack<{ ok: true }>) => void;
  "clue:submit": (p: { word: string }, ack: Ack<{ ok: true }>) => void;
  /** Any player. At a table somebody just says "okay, vote". */
  "vote:call": (p: Record<string, never>, ack: Ack<{ ok: true }>) => void;
  "vote:cast": (p: { targetId: PlayerId }, ack: Ack<{ ok: true }>) => void;
  "escape:guess": (p: { cellIndex: number }, ack: Ack<{ ok: true }>) => void;
};

export type ServerToClient = {
  "room:state": (state: RoomState) => void;
  "room:closed": (e: Err) => void;
};

export const isRoomCode = (v: unknown): v is RoomCode =>
  typeof v === "string" &&
  v.length === ROOM_CODE_LENGTH &&
  [...v].every((c) => ROOM_CODE_ALPHABET.includes(c));

export const normaliseCode = (v: string): string =>
  v.trim().toUpperCase().replace(/[^A-Z]/g, "");

/**
 * The device id is minted by the client and lands in a uuid column. A corrupted
 * localStorage value must come back as a clear error the client can recover
 * from by re-minting — not as an opaque database failure.
 */
export const isDeviceId = (v: unknown): v is DeviceId =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const normaliseName = (v: string): string =>
  v.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
