import {
  ALL_PACKS,
  CLUE_SECONDS_OPTIONS,
  DEFAULT_GIRGIT_SETTINGS,
  GIRGIT_MAX_PLAYERS,
  GIRGIT_MIN_PLAYERS,
  type ClueSeconds,
  type GirgitAction,
  type GirgitSettings,
  type PackId,
} from "../../../shared/protocol";
import { reject } from "../game/errors";
import type { GameModule } from "../game/module";
import { field, isRecord } from "../game/parse";
import {
  abortRound,
  callVote,
  castVote,
  dealRound,
  expireClues,
  pickGrid,
  scoreRound,
  setClueSeconds,
  submitClue,
  submitEscape,
  type Grid,
  type RoundState,
} from "./engine";
import { publicRound, yourRound } from "./views";

const isClueSeconds = (v: unknown): v is ClueSeconds =>
  CLUE_SECONDS_OPTIONS.includes(v as ClueSeconds);
const isPack = (v: unknown): v is PackId => ALL_PACKS.includes(v as PackId);

function parseSettings(raw: unknown, current: GirgitSettings): GirgitSettings {
  if (!isRecord(raw)) return reject("BAD_SETTING", "Those settings are unreadable.");
  const next = { ...current };
  if ("clueSeconds" in raw) {
    if (!isClueSeconds(raw.clueSeconds)) reject("BAD_SETTING", "Not a timer option.");
    next.clueSeconds = raw.clueSeconds as ClueSeconds;
  }
  if ("packs" in raw) {
    const packs = Array.isArray(raw.packs) ? [...new Set(raw.packs.filter(isPack))] : [];
    if (packs.length === 0) reject("BAD_SETTING", "Keep at least one pack on.");
    next.packs = packs;
  }
  return next;
}

function parseAction(raw: unknown): GirgitAction {
  switch (field(raw, "type")) {
    case "clue:submit":
      return { type: "clue:submit", word: String(field(raw, "word") ?? "") };
    case "vote:call":
      return { type: "vote:call" };
    case "vote:cast":
      return { type: "vote:cast", targetId: String(field(raw, "targetId") ?? "") };
    case "escape:guess":
      return { type: "escape:guess", cellIndex: Number(field(raw, "cellIndex")) };
    default:
      return reject("BAD_ACTION", "Girgit has no such move.");
  }
}

/** Girgit on the room layer. `grids` is injected so the local room and the tests choose their own deck. */
export function girgitModule(grids: readonly Grid[]): GameModule<"girgit", RoundState> {
  return {
    id: "girgit",
    minPlayers: GIRGIT_MIN_PLAYERS,
    maxPlayers: GIRGIT_MAX_PLAYERS,
    rematchDelayMs: 0,
    defaultSettings: DEFAULT_GIRGIT_SETTINGS,
    parseSettings,
    parseAction,
    deal(seats, settings, previous, rng, now) {
      const players = seats.map((s) => s.id);
      const used = previous?.usedGridIds ?? [];
      const grid = pickGrid(grids, settings.packs, used, previous?.gridId ?? null, rng);
      return dealRound(players, grid, rng, now, settings.clueSeconds, used);
    },
    act(state, playerId, action) {
      switch (action.type) {
        case "clue:submit":
          return submitClue(state, playerId, action.word);
        case "vote:call":
          return callVote(state, playerId);
        case "vote:cast":
          return castVote(state, playerId, action.targetId);
        case "escape:guess":
          return submitEscape(state, playerId, action.cellIndex);
      }
    },
    settingsChanged: (state, settings) => setClueSeconds(state, settings.clueSeconds),
    removePlayer: (state) => state,
    abort: abortRound,
    deadline: (state) => state.deadlineAt,
    expire: expireClues,
    phase: (state) => state.phase,
    outcome: (state) => state.outcome,
    isOver: (state) => state.phase === "reveal",
    score: scoreRound,
    includes: (state, playerId) => state.players.includes(playerId),
    publicView: publicRound,
    privateView: yourRound,
  };
}
