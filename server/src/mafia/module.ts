import {
  DEFAULT_MAFIA_SETTINGS,
  MAFIA_MAX_PLAYERS,
  MAFIA_MIN_PLAYERS,
  type MafiaAction,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { GameModule } from "../game/module";
import { field } from "../game/parse";
import {
  abortGame,
  callVote,
  castVote,
  closeVote,
  dealMafia,
  endNight,
  fallNight,
  pickAtNight,
  removePlayer,
  scoreGame,
  type MafiaState,
} from "./engine";
import { publicRound, yourRound } from "./views";

const target = (raw: unknown) => String(field(raw, "targetId") ?? "");

function parseAction(raw: unknown): MafiaAction {
  const type = field(raw, "type");
  switch (type) {
    case "night:pick":
    case "vote:cast":
      return { type, targetId: target(raw) };
    case "night:end":
    case "vote:call":
    case "vote:close":
    case "night:fall":
      return { type };
    default:
      return reject("BAD_ACTION", "Mafia has no such move.");
  }
}

export const mafiaModule: GameModule<"mafia", MafiaState> = {
  id: "mafia",
  minPlayers: MAFIA_MIN_PLAYERS,
  maxPlayers: MAFIA_MAX_PLAYERS,
  defaultSettings: DEFAULT_MAFIA_SETTINGS,
  parseSettings: () => DEFAULT_MAFIA_SETTINGS,
  parseAction,
  deal: (seats, _settings, _previous, rng) => dealMafia(seats, rng),
  act(state, playerId, action, { isHost }) {
    switch (action.type) {
      case "night:pick":
        return pickAtNight(state, playerId, action.targetId);
      case "night:end":
        return endNight(state, isHost);
      case "vote:call":
        return callVote(state, playerId);
      case "vote:cast":
        return castVote(state, playerId, action.targetId);
      case "vote:close":
        return closeVote(state, isHost);
      case "night:fall":
        return fallNight(state, playerId);
    }
  },
  settingsChanged: (state) => state,
  removePlayer,
  abort: abortGame,
  deadline: () => null,
  expire: (state) => state,
  phase: (state) => state.phase,
  outcome: (state) => state.outcome,
  isOver: (state) => state.phase === "over",
  score: scoreGame,
  includes: (state, playerId) => state.players.includes(playerId),
  publicView: publicRound,
  privateView: yourRound,
};
