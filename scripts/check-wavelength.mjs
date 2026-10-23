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
  isOver,
  reduce,
  verdict,
  winner,
} from "../src/lib/wavelength/engine.ts";

const MAX_POLE = 22;
const MIN_DECK = 100;
const failures = [];
const fail = (msg) => failures.push(msg);
const expect = (label, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

const deck = JSON.parse(readFileSync("shared/data/spectrums.json", "utf8"));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const ids = new Set();
const pairs = new Set();
for (const s of deck) {
  if (!s.left?.trim() || !s.right?.trim()) fail(`empty pole in ${s.id}`);
  if (s.id !== `${slug(s.left)}--${slug(s.right)}`) fail(`id ${s.id} does not match its poles`);
  if (ids.has(s.id)) fail(`duplicate id ${s.id}`);
  ids.add(s.id);
  const pair = [s.left, s.right].map((p) => p.toLowerCase()).sort().join("|");
  if (pairs.has(pair)) fail(`duplicate pair ${s.left} / ${s.right}`);
  pairs.add(pair);
  for (const pole of [s.left, s.right]) {
    if (pole.length > MAX_POLE) fail(`pole "${pole}" is over ${MAX_POLE} characters`);
  }
}
if (deck.length < MIN_DECK) fail(`deck has ${deck.length} spectra, needs ${MIN_DECK}`);

const card = (target) => ({ spectrum: deck[0], target });
const play = (game, target, dial, side) => {
  let g = reduce(game, { type: "clue" });
  g = reduce(g, { type: "move", dial });
  g = reduce(g, { type: "lock" });
  if (side) g = reduce(g, { type: "call", side });
  return g;
};
const started = (mode, target) =>
  reduce({ ...NEW_GAME, mode }, { type: "start", card: card(target) });

expect("bullseye", bandPoints(50, 52.5), 4);
expect("close", bandPoints(50, 57.5), 3);
expect("near", bandPoints(50, 62.5), 2);
expect("miss", bandPoints(50, 63), 0);
expect("dial clamps", reduce(reduce(started("teams", 50), { type: "clue" }), { type: "move", dial: 140 }).phase.dial, 100);

let g = play(started("teams", 60), 60, 55, "right");
expect("teams scores the active band", g.scores, { a: 3, b: 1 });
expect("wrong call scores nothing", play(started("teams", 60), 60, 55, "left").scores, { a: 3, b: 0 });
expect("bullseye denies the call", play(started("teams", 50), 50, 50, "right").scores, { a: 4, b: 0 });
g = reduce(g, { type: "next", card: card(40) });
expect("turn passes", g.turn, "b");

g = { ...started("teams", 50), scores: { a: 0, b: 5 } };
g = reduce(play(g, 50, 50, "left"), { type: "next", card: card(40) });
expect("catch-up keeps the turn", g.turn, "a");

g = { ...started("teams", 50), scores: { a: 9, b: 9 } };
g = play(g, 50, 60, "left");
expect("passing 10 with a lead ends it", [g.scores, isOver(g)], [{ a: 11, b: 10 }, true]);
g = { ...started("teams", 50), scores: { a: 8, b: 9 } };
g = play(g, 50, 60, "left");
expect("level at 10 plays on", [g.scores, isOver(g)], [{ a: 10, b: 10 }, false]);
g = { ...started("teams", 50), scores: { a: 8, b: 3 } };
g = reduce(play(g, 50, 50, "left"), { type: "next", card: card(40) });
expect("first to 10 wins", [g.phase.kind, winner(g)], ["over", "a"]);

g = started("together", 50);
for (let i = 0; i < 7; i++) {
  g = play(g, 50, 50, null);
  expect(`together has no call (card ${i + 1})`, g.phase.kind, "reveal");
  g = reduce(g, { type: "next", card: card(50) });
}
expect("together ends after 7", [g.phase.kind, g.scores.a, verdict(g.scores.a)], ["over", 28, "Same wavelength"]);
expect("start resets scores", reduce(g, { type: "start", card: card(50) }).scores, { a: 0, b: 0 });
expect("skip swaps the card", reduce(started("teams", 50), { type: "skip", card: card(20) }).phase.card.target, 20);
expect("moves ignored outside guess", reduce(started("teams", 50), { type: "move", dial: 10 }).phase.kind, "psychic");

if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  process.exit(1);
}
console.log(`✓ ${deck.length} spectra, rules hold`);
