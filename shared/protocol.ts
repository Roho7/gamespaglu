/**
 * The wire contract, imported by both the Next client and the socket server, so an event name or
 * payload the two sides disagree on is a compile error rather than a silent failure mid-game.
 *
 * Types, constants and tiny pure helpers only. Each game's half lives beside it.
 */
import type { DeviceId, PlayerId, RoomCode } from "./ids";
import type {
  GirgitAction,
  GirgitPhase,
  GirgitPublicRound,
  GirgitSettings,
  GirgitYourRound,
} from "./girgit";
import type {
  MafiaAction,
  MafiaPhase,
  MafiaPublicRound,
  MafiaSettings,
  MafiaYourRound,
} from "./mafia";
import type {
  TiktikiAction,
  TiktikiPhase,
  TiktikiPublicRound,
  TiktikiSettings,
  TiktikiYourRound,
} from "./tiktiki";

export type { DeviceId, PlayerId, RoomCode } from "./ids";
export * from "./girgit";
export * from "./mafia";
export * from "./tiktiki";

/** Bumped when a change is not backward compatible. */
export const PROTOCOL_VERSION = 2;

export const MAX_NAME_LENGTH = 16;
export const ROOM_CODE_LENGTH = 4;

/** No vowels, so a code can never spell a word. 21^4 is still 194,481 codes. */
export const ROOM_CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXYZ";

/** How long a room survives with nobody doing anything. */
export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

export const GAME_IDS = ["girgit", "mafia", "tiktiki"] as const;
export type GameId = (typeof GAME_IDS)[number];

/** Everything that differs per game, keyed by game, so `RoomState` narrows on `game`. */
export type GameTypes = {
  girgit: {
    phase: GirgitPhase;
    settings: GirgitSettings;
    round: GirgitPublicRound;
    your: GirgitYourRound;
    action: GirgitAction;
  };
  mafia: {
    phase: MafiaPhase;
    settings: MafiaSettings;
    round: MafiaPublicRound;
    your: MafiaYourRound;
    action: MafiaAction;
  };
  tiktiki: {
    phase: TiktikiPhase;
    settings: TiktikiSettings;
    round: TiktikiPublicRound;
    your: TiktikiYourRound;
    action: TiktikiAction;
  };
};

export type PublicPlayer = {
  id: PlayerId;
  name: string;
  seat: number;
  /** Socket presence only. A locked phone face-down on the table must never cost a seat. */
  connected: boolean;
  isHost: boolean;
  score: number;
};

export type RoomStateOf<G extends GameId> = {
  game: G;
  code: RoomCode;
  phase: "lobby" | GameTypes[G]["phase"];
  roundNo: number;
  players: PublicPlayer[];
  hostId: PlayerId;
  /** Which of `players` is the recipient. */
  you: PlayerId;
  minPlayers: number;
  maxPlayers: number;
  settings: GameTypes[G]["settings"];
  /** Epoch ms a scheduled rematch deals, so every phone can count down to it. Null otherwise. */
  startsAt: number | null;
  round: GameTypes[G]["round"] | null;
  /** Null for a player seated after the deal, who waits for the next one. */
  your: GameTypes[G]["your"] | null;
};

export type RoomState = { [G in GameId]: RoomStateOf<G> }[GameId];

export type ErrorCode =
  | "BAD_CODE"
  | "BAD_NAME"
  | "BAD_DEVICE"
  | "BAD_GAME"
  | "BAD_ACTION"
  | "BAD_TARGET"
  | "WRONG_GAME"
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
export type Done = { ok: true };

export type ClientToServer = {
  "room:create": (
    p: { deviceId: DeviceId; name: string; game: GameId; settings?: unknown },
    ack: Ack<JoinedRoom>,
  ) => void;
  /** Refused with WRONG_GAME when the code belongs to a different game. */
  "room:join": (
    p: { deviceId: DeviceId; name: string; code: RoomCode; game: GameId },
    ack: Ack<JoinedRoom>,
  ) => void;
  /** Reconnect after a reload, a lock screen or a redeploy. Never creates a seat. */
  "room:resume": (p: { deviceId: DeviceId; code: RoomCode }, ack: Ack<JoinedRoom>) => void;
  "room:leave": (p: Record<string, never>, ack: Ack<Done>) => void;
  /** Host only. For someone who has actually gone home. */
  "room:kick": (p: { playerId: PlayerId }, ack: Ack<Done>) => void;
  /** Host only. Validated by the game; takes effect immediately where the game allows it. */
  "room:settings": (p: { settings: unknown }, ack: Ack<Done>) => void;
  /** Host only. Freezes the seated players into a new deal. */
  "round:start": (p: Record<string, never>, ack: Ack<Done>) => void;
  /** Host only. Ends the round with no score. */
  "round:abort": (p: Record<string, never>, ack: Ack<Done>) => void;
  /** Every in-game move, validated and dispatched by the room's game. */
  "game:act": (p: { action: unknown }, ack: Ack<Done>) => void;
};

export type ServerToClient = {
  "room:state": (state: RoomState) => void;
  "room:closed": (e: Err) => void;
};

export const isGameId = (v: unknown): v is GameId =>
  typeof v === "string" && (GAME_IDS as readonly string[]).includes(v);

export const isRoomCode = (v: unknown): v is RoomCode =>
  typeof v === "string" &&
  v.length === ROOM_CODE_LENGTH &&
  [...v].every((c) => ROOM_CODE_ALPHABET.includes(c));

export const normaliseCode = (v: string): string =>
  v.trim().toUpperCase().replace(/[^A-Z]/g, "");

/** The device id lands in a uuid column, so a corrupted value must fail here, clearly. */
export const isDeviceId = (v: unknown): v is DeviceId =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const normaliseName = (v: string): string =>
  v.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
