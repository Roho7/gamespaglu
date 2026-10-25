import {
  DEFAULT_TIKTIKI_SETTINGS,
  ROUND_MINUTES_OPTIONS,
  TIKTIKI_MAX_PLAYERS,
  TIKTIKI_MIN_PLAYERS,
  isPlaceId,
  type RoundMinutes,
  type TiktikiAction,
  type TiktikiSettings,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { GameModule } from "../game/module";
import { field, isRecord } from "../game/parse";
import {
  abortRound,
  accuse,
  castVerdict,
  closeTrial,
  dealTiktiki,
  expireClock,
  guessPlace,
  removePlayer,
  scoreRound,
  type TiktikiState,
} from "./engine";
import { publicRound, yourRound } from "./views";

const isRoundMinutes = (v: unknown): v is RoundMinutes => ROUND_MINUTES_OPTIONS.includes(v as RoundMinutes);

function parseSettings(raw: unknown, current: TiktikiSettings): TiktikiSettings {
  if (!isRecord(raw)) return reject("BAD_SETTING", "Those settings are unreadable.");
  if (!("roundMinutes" in raw)) return current;
  if (!isRoundMinutes(raw.roundMinutes)) reject("BAD_SETTING", "Not a clock option.");
  return { ...current, roundMinutes: raw.roundMinutes as RoundMinutes };
}

function parseAction(raw: unknown): TiktikiAction {
  switch (field(raw, "type")) {
    case "accuse":
      return { type: "accuse", targetId: String(field(raw, "targetId") ?? "") };
    case "verdict":
      return { type: "verdict", guilty: field(raw, "guilty") === true };
    case "verdict:close":
      return { type: "verdict:close" };
    case "guess": {
      const placeId = field(raw, "placeId");
      return isPlaceId(placeId) ? { type: "guess", placeId } : reject("BAD_TARGET", "That place isn't on the table.");
    }
    default:
      return reject("BAD_ACTION", "Tiktiki has no such move.");
  }
}

export const tiktikiModule: GameModule<"tiktiki", TiktikiState> = {
  id: "tiktiki",
  minPlayers: TIKTIKI_MIN_PLAYERS,
  maxPlayers: TIKTIKI_MAX_PLAYERS,
  rematchDelayMs: 5000,
  defaultSettings: DEFAULT_TIKTIKI_SETTINGS,
  parseSettings,
  parseAction,
  deal: (seats, settings, previous, rng, now) => dealTiktiki(seats, settings.roundMinutes, previous, rng, now()),
  act(state, playerId, action, { isHost, now }) {
    switch (action.type) {
      case "accuse":
        return accuse(state, playerId, action.targetId, now());
      case "verdict":
        return castVerdict(state, playerId, action.guilty, now());
      case "verdict:close":
        return closeTrial(state, isHost, now());
      case "guess":
        return guessPlace(state, playerId, action.placeId);
    }
  },
  settingsChanged: (state) => state,
  removePlayer,
  abort: abortRound,
  deadline: (state) => (state.phase === "questioning" ? state.deadlineAt : null),
  expire: expireClock,
  phase: (state) => state.phase,
  outcome: (state) => state.outcome,
  isOver: (state) => state.phase === "over",
  score: scoreRound,
  includes: (state, playerId) => state.players.includes(playerId),
  publicView: publicRound,
  privateView: yourRound,
};
