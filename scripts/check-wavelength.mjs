#!/usr/bin/env node
/*
 * Wavelength check — the spectrum deck and the scoring rules.
 *
 *   node scripts/check-wavelength.mjs
 *
 * The deck fails on duplicate ids or pairs, empty poles, and poles too long
 * to sit beside the dial. The rules are driven through the real reducer, so a
 * scoring or turn-order regression fails here rather than mid-game.
 */
import { readFileSync } from "node:fs";
import {
  NEW_GAME,
  bandPoints,
  leaders,
  reduce,
  roles,
  rosterProblem,
} from "../src/lib/wavelength/engine.ts";

const MAX_POLE = 22;
const MIN_DECK = 100;
const failures = [];
const fail = (msg) => failures.push(msg);
const expect = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
};

const deck = JSON.parse(readFileSync("shared/data/spectrums.json", "utf8"));
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const ids = new Set();
const pairs = new Set();
for (const s of deck) {
  if (!s.left?.trim() || !s.right?.trim()) fail(`empty pole in ${s.id}`);
  if (s.id !== `${slug(s.left)}--${slug(s.right)}`)
    fail(`id ${s.id} does not match its poles`);
  if (ids.has(s.id)) fail(`duplicate id ${s.id}`);
  ids.add(s.id);
  const pair = [s.left, s.right]
    .map((p) => p.toLowerCase())
    .sort()
    .join("|");
  if (pairs.has(pair)) fail(`duplicate pair ${s.left} / ${s.right}`);
  pairs.add(pair);
  for (const pole of [s.left, s.right]) {
    if (pole.length > MAX_POLE)
      fail(`pole "${pole}" is over ${MAX_POLE} characters`);
  }
}
if (deck.length < MIN_DECK)
  fail(`deck has ${deck.length} spectra, needs ${MIN_DECK}`);

const card = (target) => ({ spectrum: deck[0], target });
const seat = (id, members = []) => ({ id, name: id, members });
const PLAYERS = ["ana", "ben", "cara"].map((id) => seat(id));
const TEAMS = [seat("a", ["ana", "ben"]), seat("b", ["cara", "dev", "eli"])];
const started = (mode, seats, target = 50, rounds = 2) =>
  reduce(
    reduce(reduce({ ...NEW_GAME, mode, rounds }, { type: "setup" }), {
      type: "rounds",
      rounds,
    }),
    { type: "start", seats, card: card(target) },
  );
const guess = (game, ...dials) => {
  let g = reduce(game, { type: "clue", text: "  chai  " });
  for (const dial of dials) {
    g = reduce(g, { type: "move", dial });
    g = reduce(g, { type: "lock" });
  }
  return g;
};
const points = (g) =>
  Object.fromEntries(g.phase.awards.map((a) => [a.seat, a.points]));

expect("bullseye", bandPoints(50, 52.5), 4);
expect("close", bandPoints(50, 57.5), 2);
expect("near", bandPoints(50, 62.5), 1);
expect("miss", bandPoints(50, 63), 0);

expect(
  "two players minimum",
  rosterProblem("psychic", [seat("ana")]),
  "Add at least two players.",
);
expect(
  "teams need two each",
  rosterProblem("teams", [seat("a", ["ana"]), seat("b", ["ben", "cara"])]) !==
    null,
  true,
);
expect("valid teams", rosterProblem("teams", TEAMS), null);
expect(
  "start refuses a short roster",
  reduce(reduce(NEW_GAME, { type: "setup" }), {
    type: "start",
    seats: [seat("ana")],
    card: card(50),
  }).phase.kind,
  "players",
);

let g = started("psychic", PLAYERS);
expect("psychic rotates from the first seat", roles(g).peeker, "ana");
expect(
  "guessers follow the psychic",
  roles(g).guessers.map((s) => s.id),
  ["ben", "cara"],
);
g = reduce(g, { type: "clue", text: "  chai  " });
expect("clue is trimmed", g.phase.clue, "chai");
g = reduce(reduce(g, { type: "move", dial: 140 }), { type: "lock" });
expect("dial clamps", g.phase.guesses[0].dial, 100);
expect(
  "each guesser starts at centre",
  [g.phase.kind, g.phase.dial],
  ["guess", 50],
);
g = guess(started("psychic", PLAYERS), 50, 57);
expect("psychic scores the rounded average", points(g), {
  ben: 4,
  cara: 2,
  ana: 3,
});
g = reduce(g, { type: "next", card: card(40) });
expect(
  "next psychic",
  [roles(g).peeker, roles(g).guessers.map((s) => s.id)],
  ["ben", ["cara", "ana"]],
);

g = guess(started("guesser", PLAYERS), 55);
expect("one guesser scores alone", points(g), { ana: 2 });
expect("clue-givers all peek", roles(g).peeker, null);

g = started("teams", TEAMS, 60);
expect(
  "team A's first psychic",
  [roles(g).active.id, roles(g).peeker, roles(g).caller.id],
  ["a", "ana", "b"],
);
g = guess(g, 55);
expect("teams wait for the call", g.phase.kind, "call");
expect(
  "right call scores 1",
  points(reduce(g, { type: "call", side: "right" })),
  { a: 2, b: 1 },
);
expect(
  "wrong call scores nothing",
  points(reduce(g, { type: "call", side: "left" })),
  { a: 2, b: 0 },
);
g = reduce(guess(started("teams", TEAMS, 40), 55), {
  type: "call",
  side: "left",
});
expect("call reads the locked dial", points(g), { a: 0, b: 1 });
expect(
  "bullseye denies the call",
  points(
    reduce(guess(started("teams", TEAMS, 50), 50), {
      type: "call",
      side: "right",
    }),
  ),
  { a: 4, b: 0 },
);
g = reduce(reduce(g, { type: "call", side: "left" }), {
  type: "next",
  card: card(40),
});
expect(
  "turn passes to team B",
  [roles(g).active.id, roles(g).peeker],
  ["b", "cara"],
);
g = reduce(reduce(guess(g, 40), { type: "call", side: "left" }), {
  type: "next",
  card: card(40),
});
expect(
  "psychic rotates inside the team",
  [roles(g).active.id, roles(g).peeker],
  ["a", "ben"],
);

g = started("guesser", PLAYERS, 50, 2);
for (let i = 0; i < 6; i++) {
  g = guess(g, 50);
  g = reduce(g, { type: "next", card: card(50) });
}
expect("a round is one turn each", g.phase.kind, "over");
expect(
  "play again restarts at the first turn",
  [reduce(g, { type: "start", seats: PLAYERS, card: card(50) }).turn],
  [0],
);
expect(
  "skip swaps the card",
  reduce(started("teams", TEAMS), { type: "skip", card: card(20) }).phase.card
    .target,
  20,
);
expect(
  "moves ignored outside guess",
  reduce(started("teams", TEAMS), { type: "move", dial: 10 }).phase.kind,
  "psychic",
);
expect(
  "reset keeps mode and rounds",
  [
    reduce(g, { type: "reset" }).mode,
    reduce(g, { type: "reset" }).rounds,
    reduce(g, { type: "reset" }).phase.kind,
  ],
  ["guesser", 2, "briefing"],
);
const tally = { ana: 5, ben: 5, cara: 2 };
expect(
  "tied leaders",
  leaders(PLAYERS, (id) => tally[id]).map((s) => s.id),
  ["ana", "ben"],
);
expect(
  "nobody leads at zero",
  leaders(PLAYERS, () => 0),
  [],
);

if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  process.exit(1);
}
console.log(`✓ ${deck.length} spectra, rules hold`);
