import { GRID_SIZE } from "../../../shared/protocol";
import { between, pickOne, type BotBrain } from "../game/bot";
import type { RoundState } from "./engine";

const CLUES = ["Obviously", "Classic", "Iconic", "Big energy", "Nostalgia", "Trust me", "Famous", "Loud", "Vibes", "Hmm"];

/**
 * Bots clue on their own, then wait for your vote. As the Girgit they all accuse you, so you reach
 * the escape guess; as an innocent they follow your pick, so you decide whether the Girgit is caught.
 */
export const girgitBrain: BotBrain = (room, bot, you, rng) => {
  const s = room.round?.state as RoundState | undefined;
  if (!s || !s.players.includes(bot)) return null;
  switch (s.phase) {
    case "clues":
      return s.clues[bot]
        ? null
        : { action: { type: "clue:submit", word: pickOne(CLUES, rng) }, delayMs: between(1500, 6500, rng) };
    case "vote": {
      const yours = s.votes[you];
      if (s.votes[bot] || !yours) return null;
      const wanted = s.girgit === you ? you : yours;
      const others = s.players.filter((p) => p !== bot && p !== you);
      const targetId = wanted !== bot ? wanted : pickOne(others, rng);
      return { action: { type: "vote:cast", targetId }, delayMs: between(600, 2000, rng) };
    }
    case "escape": {
      if (s.girgit !== bot) return null;
      const cellIndex = rng() < 1 / 3 ? s.secretIndex : Math.floor(rng() * GRID_SIZE);
      return { action: { type: "escape:guess", cellIndex }, delayMs: 2500 };
    }
    default:
      return null;
  }
};
