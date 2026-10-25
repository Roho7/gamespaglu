import type { GameId, GameTypes, PlayerId } from "../../../shared/protocol";

export type Rng = () => number;
export type Now = () => number;

/** A seated player at the moment of the deal. */
export type Seat = { id: PlayerId; name: string };

export type ActContext = { isHost: boolean; rng: Rng; now: Now };

/**
 * One game's rules, as pure functions over its own state. The room layer owns seats, hosts,
 * persistence and scores; a module owns everything that happens between the deal and the end.
 */
export type GameModule<G extends GameId, State> = {
  id: G;
  minPlayers: number;
  maxPlayers: number;
  /** How long a rematch counts down before the deal, so every phone sees it coming. 0 deals at once. */
  rematchDelayMs: number;
  defaultSettings: GameTypes[G]["settings"];
  /** Throws BAD_SETTING. `current` lets a partial update keep the rest. */
  parseSettings(raw: unknown, current: GameTypes[G]["settings"]): GameTypes[G]["settings"];
  /** Throws BAD_ACTION. Wire input is untrusted. */
  parseAction(raw: unknown): GameTypes[G]["action"];
  /** `previous` is the last round in this room, for anything carried between deals. */
  deal(
    seats: Seat[],
    settings: GameTypes[G]["settings"],
    previous: State | null,
    rng: Rng,
    now: Now,
  ): State;
  act(state: State, playerId: PlayerId, action: GameTypes[G]["action"], ctx: ActContext): State;
  /** Applied to a running round when the host changes settings. */
  settingsChanged(state: State, settings: GameTypes[G]["settings"]): State;
  /** A player left or was kicked mid-round. */
  removePlayer(state: State, playerId: PlayerId): State;
  abort(state: State): State;
  /** Epoch ms the current phase times out, or null when it is untimed. */
  deadline(state: State): number | null;
  expire(state: State): State;
  phase(state: State): GameTypes[G]["phase"];
  outcome(state: State): string | null;
  isOver(state: State): boolean;
  /** Points per player, applied once, on the transition to over. */
  score(state: State): Record<PlayerId, number>;
  includes(state: State, playerId: PlayerId): boolean;
  publicView(state: State, roundNo: number): GameTypes[G]["round"];
  privateView(state: State, playerId: PlayerId): GameTypes[G]["your"];
};

/** A module with its state type erased, which is how the room layer holds them. */
export type AnyGameModule = GameModule<GameId, unknown>;
