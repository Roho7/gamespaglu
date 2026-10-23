/**
 * Wavelength rules as a pure reducer. No React, no randomness: anything random
 * (the next card) arrives inside the action, so every transition is
 * reproducible and `scripts/check-wavelength.mjs` can drive it directly.
 */

export type Spectrum = { id: string; left: string; right: string };
export type Card = { spectrum: Spectrum; target: number };

export type Team = "a" | "b";
export type Mode = "teams" | "together";
export type Side = "left" | "right";
export type Points = { active: number; other: number };

export type Phase =
  | { kind: "briefing" }
  | { kind: "psychic"; card: Card }
  | { kind: "guess"; card: Card; dial: number }
  | { kind: "call"; card: Card; dial: number }
  | {
      kind: "reveal";
      card: Card;
      dial: number;
      call: Side | null;
      points: Points;
    }
  | { kind: "over" };

export type Game = {
  mode: Mode;
  phase: Phase;
  scores: Record<Team, number>;
  turn: Team;
  cardsPlayed: number;
};

export type Action =
  | { type: "mode"; mode: Mode }
  | { type: "start"; card: Card }
  | { type: "skip"; card: Card }
  | { type: "clue" }
  | { type: "move"; dial: number }
  | { type: "lock" }
  | { type: "call"; side: Side }
  | { type: "next"; card: Card }
  | { type: "reset" };

export const WIN_SCORE = 10;
export const TOGETHER_CARDS = 7;
export const TARGET_MIN = 10;
export const TARGET_MAX = 90;
export const DIAL_START = 50;

/** Scoring bands, centre out. `reach` is the distance from the target on a 0..100 dial. */
export const BANDS = [
  { points: 4, reach: 2.5 },
  { points: 3, reach: 7.5 },
  { points: 2, reach: 12.5 },
] as const;

export const NEW_GAME: Game = {
  mode: "teams",
  phase: { kind: "briefing" },
  scores: { a: 0, b: 0 },
  turn: "a",
  cardsPlayed: 0,
};

export function otherTeam(team: Team): Team {
  return team === "a" ? "b" : "a";
}

export function clampDial(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function bandPoints(dial: number, target: number): number {
  const distance = Math.abs(dial - target);
  return BANDS.find((b) => distance <= b.reach)?.points ?? 0;
}

export function targetSide(dial: number, target: number): Side {
  return target < dial ? "left" : "right";
}

function score(game: Game, card: Card, dial: number, call: Side | null): Game {
  const active = bandPoints(dial, card.target);
  const other =
    call !== null && active < 4 && call === targetSide(dial, card.target)
      ? 1
      : 0;
  const scores = { ...game.scores };
  scores[game.turn] += active;
  scores[otherTeam(game.turn)] += other;
  return {
    ...game,
    scores,
    cardsPlayed: game.cardsPlayed + 1,
    phase: { kind: "reveal", card, dial, call, points: { active, other } },
  };
}

/** The leading team once the game is over, or null for a Together game. */
export function winner(game: Game): Team | null {
  if (game.mode === "together") return null;
  return game.scores.a > game.scores.b ? "a" : "b";
}

export function isOver(game: Game): boolean {
  if (game.mode === "together") return game.cardsPlayed >= TOGETHER_CARDS;
  const top = Math.max(game.scores.a, game.scores.b);
  return top >= WIN_SCORE && game.scores.a !== game.scores.b;
}

function nextTurn(game: Game, points: Points): Team {
  if (game.mode === "together") return game.turn;
  const behind = game.scores[game.turn] < game.scores[otherTeam(game.turn)];
  return points.active === 4 && behind ? game.turn : otherTeam(game.turn);
}

export function reduce(game: Game, action: Action): Game {
  const { phase } = game;
  switch (action.type) {
    case "mode":
      return phase.kind === "briefing" ? { ...game, mode: action.mode } : game;
    case "start":
      if (phase.kind !== "briefing" && phase.kind !== "over") return game;
      return {
        ...NEW_GAME,
        mode: game.mode,
        phase: { kind: "psychic", card: action.card },
      };
    case "skip":
      return phase.kind === "psychic"
        ? { ...game, phase: { kind: "psychic", card: action.card } }
        : game;
    case "clue":
      return phase.kind === "psychic"
        ? {
            ...game,
            phase: { kind: "guess", card: phase.card, dial: DIAL_START },
          }
        : game;
    case "move":
      return phase.kind === "guess"
        ? { ...game, phase: { ...phase, dial: clampDial(action.dial) } }
        : game;
    case "lock":
      if (phase.kind !== "guess") return game;
      return game.mode === "teams"
        ? { ...game, phase: { kind: "call", card: phase.card, dial: phase.dial } }
        : score(game, phase.card, phase.dial, null);
    case "call":
      return phase.kind === "call"
        ? score(game, phase.card, phase.dial, action.side)
        : game;
    case "next":
      if (phase.kind !== "reveal") return game;
      if (isOver(game)) return { ...game, phase: { kind: "over" } };
      return {
        ...game,
        turn: nextTurn(game, phase.points),
        phase: { kind: "psychic", card: action.card },
      };
    case "reset":
      return { ...NEW_GAME, mode: game.mode };
  }
}

/** Together mode's one-line verdict for a final total. */
export function verdict(total: number): string {
  if (total >= 24) return "Same wavelength";
  if (total >= 18) return "Tuned in";
  if (total >= 10) return "Some signal";
  return "Static";
}
