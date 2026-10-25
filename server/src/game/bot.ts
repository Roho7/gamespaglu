import type { PlayerId } from "../../../shared/protocol";
import type { Rng } from "./module";
import type { RoomRecord } from "./room";

/** A bot's next move, or null to wait. */
export type BotMove = { action: unknown; delayMs: number };

/**
 * How a local-room bot decides. It reads the whole room, secrets included, because it is a test
 * rig for one human, not an opponent. `you` is that human, whom bots wait on and follow.
 */
export type BotBrain = (room: RoomRecord, bot: PlayerId, you: PlayerId, rng: Rng) => BotMove | null;

export const pickOne = <T>(xs: readonly T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)];

export const between = (min: number, max: number, rng: Rng) => Math.round(min + rng() * (max - min));
