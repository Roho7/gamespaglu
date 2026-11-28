import {
  DEFAULT_SH_SETTINGS,
  SH_MAX_PLAYERS,
  SH_MIN_PLAYERS,
  type ShAction,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { GameModule } from "../game/module";
import { field } from "../game/parse";
import { abortSh, dealSh, reduce, scoreSh, type ShState } from "./engine";
import { publicRound, yourRound } from "./views";

const target = (raw: unknown) => String(field(raw, "targetId") ?? "");
const index = (raw: unknown) => Number(field(raw, "index"));

function parseAction(raw: unknown): ShAction {
  const type = field(raw, "type");
  switch (type) {
    case "nominate":
    case "investigate":
    case "special-election":
    case "execute":
      return { type, targetId: target(raw) };
    case "vote":
      return { type, ja: field(raw, "ja") === true };
    case "veto:answer":
      return { type, agree: field(raw, "agree") === true };
    case "discard":
    case "enact":
      return { type, index: index(raw) };
    case "veto":
    case "peek:done":
      return { type };
    default:
      return reject("BAD_ACTION", "Secret Hitler has no such move.");
  }
}

/** A seat leaving takes a secret role with it, so the game ends with no winner. See RULES.md. */
export const secretHitlerModule: GameModule<"secret-hitler", ShState> = {
  id: "secret-hitler",
  minPlayers: SH_MIN_PLAYERS,
  maxPlayers: SH_MAX_PLAYERS,
  rematchDelayMs: 5000,
  defaultSettings: DEFAULT_SH_SETTINGS,
  parseSettings: () => DEFAULT_SH_SETTINGS,
  parseAction,
  deal: (seats, _settings, _previous, rng) => dealSh(seats, rng),
  act: (state, playerId, action, { rng }) => reduce(state, playerId, action, rng),
  settingsChanged: (state) => state,
  removePlayer: abortSh,
  abort: abortSh,
  deadline: () => null,
  expire: (state) => state,
  phase: (state) => state.phase,
  outcome: (state) => state.outcome?.winner ?? state.outcome?.reason ?? null,
  isOver: (state) => state.phase === "over",
  score: scoreSh,
  includes: (state, playerId) => state.players.includes(playerId),
  publicView: publicRound,
  privateView: yourRound,
};
