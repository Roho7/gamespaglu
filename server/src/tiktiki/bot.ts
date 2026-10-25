import type { PlayerId } from "../../../shared/protocol";
import { between, pickOne, type BotBrain } from "../game/bot";
import { present, trialOutstanding, type TiktikiState } from "./engine";

/**
 * Bots follow your verdict most of the time, and a Tiktiki bot always votes to convict someone
 * else. One bot accuses someone partway through the clock, once a round, so the trial screens show
 * up without you starting one. A Tiktiki bot names the right place now and then.
 */
export const tiktikiBrain: BotBrain = (room, bot, you, rng) => {
  const s = room.round?.state as TiktikiState | undefined;
  if (!s || !present(s).includes(bot)) return null;
  switch (s.phase) {
    case "questioning": {
      const accuser = present(s).find((p) => p !== you && !s.accusers.includes(p));
      if (bot !== accuser || s.accusers.some((p) => p !== you)) return null;
      const target: PlayerId = pickOne(present(s).filter((p) => p !== bot), rng);
      return { action: { type: "accuse", targetId: target }, delayMs: between(20_000, 40_000, rng) };
    }
    case "accusation": {
      if (!trialOutstanding(s).includes(bot)) return null;
      const yours = s.trial?.votes[you];
      if (trialOutstanding(s).includes(you) && you !== s.trial?.accusedId) return null;
      const guilty = bot === s.tiktikiId || ((yours ?? rng() < 0.6) && rng() < 0.85);
      return { action: { type: "verdict", guilty }, delayMs: between(700, 2200, rng) };
    }
    case "guess": {
      if (bot !== s.tiktikiId) return null;
      const placeId = rng() < 0.4 ? s.placeId : pickOne(s.suspects, rng);
      return { action: { type: "guess", placeId }, delayMs: between(3000, 6000, rng) };
    }
    default:
      return null;
  }
};
