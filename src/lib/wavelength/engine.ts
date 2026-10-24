/**
 * Wavelength rules as a pure reducer. No React, no randomness: anything random
 * (the next card) arrives inside the action, so every transition is
 * reproducible and `scripts/check-wavelength.mjs` can drive it directly.
 *
 * Scores are not kept here. A reveal carries the round's `awards`, and the
 * screen adds them to the shared scoreboard, which is the one tally.
 */

export type Spectrum = { id: string; left: string; right: string };
export type Card = { spectrum: Spectrum; target: number };

/**
 * `psychic`: one Psychic a card, everyone else guesses in secret.
 * `guesser`: everyone else gives clues, one player guesses.
 * `teams`: two teams take turns; the other team calls left or right.
 */
export type Mode = "psychic" | "guesser" | "teams";
export type Side = "left" | "right";

/** One scoreboard row: a player, or in Teams a team and its members. */
export type Seat = { id: string; name: string; members: string[] };
export type Guess = { seat: string; dial: number };
export type Award = { seat: string; points: number; role: Role };
export type Role = "guess" | "psychic" | "call";

export type Phase =
  | { kind: "briefing" }
  | { kind: "players" }
  | { kind: "psychic"; card: Card }
  | { kind: "guess"; card: Card; clue: string; dial: number; guesses: Guess[] }
  | { kind: "call"; card: Card; clue: string; guesses: Guess[] }
  | {
      kind: "reveal";
      card: Card;
      clue: string;
      guesses: Guess[];
      call: Side | null;
      awards: Award[];
    }
  | { kind: "over" };

export type Game = {
  mode: Mode;
  rounds: number;
  seats: Seat[];
  turn: number;
  phase: Phase;
};

export type Action =
  | { type: "mode"; mode: Mode }
  | { type: "rounds"; rounds: number }
  | { type: "setup" }
  | { type: "start"; seats: Seat[]; card: Card }
  | { type: "skip"; card: Card }
  | { type: "clue"; text: string }
  | { type: "move"; dial: number }
  | { type: "lock" }
  | { type: "call"; side: Side }
  | { type: "next"; card: Card }
  | { type: "reset" };

export const MODES: Mode[] = ["psychic", "guesser", "teams"];
export const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6];
export const TARGET_MIN = 10;
export const TARGET_MAX = 90;
export const DIAL_START = 50;
export const CLUE_MAX = 60;

/** Scoring bands, centre out. `reach` is the distance from the target on a 0..100 dial. */
export const BANDS = [
  { points: 4, reach: 2.5 },
  { points: 2, reach: 7.5 },
  { points: 1, reach: 12.5 },
] as const;
export const BULLSEYE = BANDS[0].points;

export const NEW_GAME: Game = {
  mode: "psychic",
  rounds: 3,
  seats: [],
  turn: 0,
  phase: { kind: "briefing" },
};

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

/** Why a roster can't start this mode, or null when it can. */
export function rosterProblem(mode: Mode, seats: Seat[]): string | null {
  if (mode === "teams") {
    if (seats.length !== 2) return "Teams needs exactly two teams.";
    const short = seats.find((s) => s.members.length < 2);
    return short
      ? `${short.name} needs two players: a Psychic and a guesser.`
      : null;
  }
  return seats.length < 2 ? "Add at least two players." : null;
}

/** Cards in a full game: a round is one turn for every seat. */
export function totalTurns(game: Game): number {
  return game.rounds * game.seats.length;
}

export function roundOf(game: Game): number {
  return Math.floor(game.turn / Math.max(1, game.seats.length)) + 1;
}

/**
 * Who does what on a given turn. `active` is the seat whose turn it is (the
 * Psychic, the lone guesser, or the active team); `peeker` is the name of the
 * one person who holds the dial to see the target, or null in One Guesser,
 * where every clue-giver looks.
 */
export type TurnRoles = {
  active: Seat;
  peeker: string | null;
  guessers: Seat[];
  caller: Seat | null;
};

export function rolesAt(game: Game, turn: number): TurnRoles {
  const { seats } = game;
  const active = seats[turn % seats.length];
  switch (game.mode) {
    case "psychic": {
      const i = turn % seats.length;
      return {
        active,
        peeker: active.name,
        guessers: [...seats.slice(i + 1), ...seats.slice(0, i)],
        caller: null,
      };
    }
    case "guesser":
      return { active, peeker: null, guessers: [active], caller: null };
    case "teams": {
      const lap = Math.floor(turn / seats.length);
      return {
        active,
        peeker: active.members[lap % active.members.length],
        guessers: [active],
        caller: seats[(turn + 1) % seats.length],
      };
    }
  }
}

export function roles(game: Game): TurnRoles {
  return rolesAt(game, game.turn);
}

/** The round's points, one award per seat that scored or could have. */
export function awardsFor(
  game: Game,
  card: Card,
  guesses: Guess[],
  call: Side | null,
): Award[] {
  const { active, caller } = roles(game);
  const scored = guesses.map((g): Award => ({
    seat: g.seat,
    points: bandPoints(g.dial, card.target),
    role: "guess",
  }));
  if (game.mode === "psychic") {
    const average =
      scored.reduce((sum, a) => sum + a.points, 0) / Math.max(1, scored.length);
    return [
      ...scored,
      { seat: active.id, points: Math.round(average), role: "psychic" },
    ];
  }
  if (game.mode === "teams" && caller && call) {
    const [main] = scored;
    const right =
      main.points < BULLSEYE &&
      call === targetSide(guesses[0].dial, card.target);
    return [
      ...scored,
      { seat: caller.id, points: right ? 1 : 0, role: "call" },
    ];
  }
  return scored;
}

function reveal(
  game: Game,
  card: Card,
  clue: string,
  guesses: Guess[],
  call: Side | null,
): Game {
  return {
    ...game,
    phase: {
      kind: "reveal",
      card,
      clue,
      guesses,
      call,
      awards: awardsFor(game, card, guesses, call),
    },
  };
}

export function isLastTurn(game: Game): boolean {
  return game.turn + 1 >= totalTurns(game);
}

export function reduce(game: Game, action: Action): Game {
  const { phase } = game;
  switch (action.type) {
    case "mode":
      return phase.kind === "briefing" ? { ...game, mode: action.mode } : game;
    case "rounds":
      return phase.kind === "briefing" && ROUND_OPTIONS.includes(action.rounds)
        ? { ...game, rounds: action.rounds }
        : game;
    case "setup":
      return phase.kind === "briefing"
        ? { ...game, phase: { kind: "players" } }
        : game;
    case "start":
      if (phase.kind !== "players" && phase.kind !== "over") return game;
      if (rosterProblem(game.mode, action.seats)) return game;
      return {
        ...game,
        seats: action.seats,
        turn: 0,
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
            phase: {
              kind: "guess",
              card: phase.card,
              clue: action.text.trim().slice(0, CLUE_MAX),
              dial: DIAL_START,
              guesses: [],
            },
          }
        : game;
    case "move":
      return phase.kind === "guess"
        ? { ...game, phase: { ...phase, dial: clampDial(action.dial) } }
        : game;
    case "lock": {
      if (phase.kind !== "guess") return game;
      const { guessers } = roles(game);
      const guesses = [
        ...phase.guesses,
        { seat: guessers[phase.guesses.length].id, dial: phase.dial },
      ];
      if (guesses.length < guessers.length)
        return { ...game, phase: { ...phase, dial: DIAL_START, guesses } };
      if (game.mode === "teams")
        return {
          ...game,
          phase: { kind: "call", card: phase.card, clue: phase.clue, guesses },
        };
      return reveal(game, phase.card, phase.clue, guesses, null);
    }
    case "call":
      return phase.kind === "call"
        ? reveal(game, phase.card, phase.clue, phase.guesses, action.side)
        : game;
    case "next":
      if (phase.kind !== "reveal") return game;
      if (isLastTurn(game)) return { ...game, phase: { kind: "over" } };
      return {
        ...game,
        turn: game.turn + 1,
        phase: { kind: "psychic", card: action.card },
      };
    case "reset":
      return { ...NEW_GAME, mode: game.mode, rounds: game.rounds };
  }
}

/** The seats sharing the top score, or none before anyone has scored. */
export function leaders(
  seats: Seat[],
  scoreOf: (id: string) => number,
): Seat[] {
  const top = Math.max(...seats.map((s) => scoreOf(s.id)));
  return top > 0 ? seats.filter((s) => scoreOf(s.id) === top) : [];
}
