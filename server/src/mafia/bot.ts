import { NO_ONE, type PlayerId } from "../../../shared/protocol";
import { between, pickOne, type BotBrain } from "../game/bot";
import type { Rng } from "../game/module";
import { agreedKill, isAlive, living, livingWith, type MafiaState } from "./engine";

/** The Mafia's pick every bot on the team falls in behind: yours if you are Mafia, else the first made. */
function teamLead(s: MafiaState, you: PlayerId): PlayerId | null {
  const team = livingWith(s, "mafia");
  if (team.includes(you) && s.picks[you]) return s.picks[you];
  const first = team.find((p) => s.picks[p]);
  return first ? s.picks[first] : null;
}

function nightTarget(s: MafiaState, bot: PlayerId, you: PlayerId, rng: Rng): PlayerId {
  const others = living(s).filter((p) => p !== bot);
  switch (s.roles[bot]) {
    case "mafia":
      return teamLead(s, you) ?? pickOne(others.filter((p) => s.roles[p] !== "mafia"), rng);
    case "doctor":
      return pickOne(living(s).filter((p) => p !== s.lastSave), rng);
    default:
      return pickOne(others, rng);
  }
}

function ballot(s: MafiaState, bot: PlayerId, you: PlayerId, rng: Rng): PlayerId {
  const yours = s.votes[you];
  const fair = living(s).filter(
    (p) => p !== bot && !(s.roles[bot] === "mafia" && s.roles[p] === "mafia"),
  );
  if (yours && yours !== bot && (yours === NO_ONE || fair.includes(yours)) && rng() < 0.7) return yours;
  return rng() < 0.15 || fair.length === 0 ? NO_ONE : pickOne(fair, rng);
}

/**
 * Bots play every role straight. While you are alive they wait for you to call the vote and let night
 * fall; once you are out, the first living bot does it, so a game you have left still finishes.
 */
export const mafiaBrain: BotBrain = (room, bot, you, rng) => {
  const s = room.round?.state as MafiaState | undefined;
  if (!s || !isAlive(s, bot)) return null;
  const youPlay = isAlive(s, you);
  const leads = !youPlay && living(s)[0] === bot;
  switch (s.phase) {
    case "night": {
      const stillMafia = s.roles[bot] === "mafia" && agreedKill(s) === null;
      if (s.picks[bot] && !stillMafia) return null;
      const targetId = nightTarget(s, bot, you, rng);
      if (s.picks[bot] === targetId) return null;
      return { action: { type: "night:pick", targetId }, delayMs: between(1000, 4000, rng) };
    }
    case "day":
      return leads ? { action: { type: "vote:call" }, delayMs: 4000 } : null;
    case "vote":
      if (s.votes[bot] || (youPlay && !s.votes[you])) return null;
      return { action: { type: "vote:cast", targetId: ballot(s, bot, you, rng) }, delayMs: between(700, 2200, rng) };
    case "verdict":
      return leads ? { action: { type: "night:fall" }, delayMs: 3500 } : null;
    default:
      return null;
  }
};
