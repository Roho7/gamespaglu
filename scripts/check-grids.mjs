#!/usr/bin/env node
/*
 * Girgit grid check — run after touching shared/data/grids.json or any pool.
 *
 *   node scripts/check-grids.mjs
 *
 * Grids hold entry IDS, not labels, so that one fame bar covers Who Am I? and
 * Girgit and a renamed label cannot silently orphan a grid cell. That only
 * works if something fails loudly when an id stops resolving — this is that
 * something.
 *
 * It also enforces the two things that are invisible in the data and obvious on
 * a phone: a grid that is not exactly 16 cells, and a word too long to render
 * in an ~85px cell.
 */
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(`shared/data/${f}.json`, "utf8"));
const slug = (l) =>
  l.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const GRID_SIZE = 16;
const WARN_LENGTH = 16;
const FAIL_LENGTH = 20;

/** Every pool a grid may draw from. Object pools carry metadata; flat ones don't. */
const OBJECT_POOLS = ["movies", "celebrities", "tv", "companies", "places"];
const FLAT_POOLS = ["animals", "objects", "everyday"];

const byId = new Map();
for (const p of OBJECT_POOLS) {
  for (const row of load(p)) byId.set(slug(row.label), { ...row, pool: p });
}
for (const p of FLAT_POOLS) {
  for (const label of load(p)) byId.set(slug(label), { label, pool: p });
}

const grids = load("grids");
let bad = 0;
const fail = (m) => {
  console.log(`FAIL ${m}`);
  bad++;
};

const seenGridIds = new Set();
let longest = { label: "", n: 0 };

for (const g of grids) {
  if (seenGridIds.has(g.id)) fail(`duplicate grid id ${g.id}`);
  seenGridIds.add(g.id);

  if (g.cells.length !== GRID_SIZE) {
    fail(`${g.id}: ${g.cells.length} cells, expected ${GRID_SIZE}`);
  }
  const dupes = g.cells.filter((c, i) => g.cells.indexOf(c) !== i);
  if (dupes.length) fail(`${g.id}: duplicate cells ${[...new Set(dupes)].join(", ")}`);

  for (const id of g.cells) {
    const entry = byId.get(id);
    if (!entry) {
      // The whole point of holding ids: this is a rename nobody propagated.
      fail(`${g.id}: no entry for id "${id}"`);
      continue;
    }
    // A grid is played out loud with family in the room; the opt-in notoriety
    // axis does not leak into it.
    if (entry.spicy) fail(`${g.id}: "${entry.label}" is spicy and must not be in a grid`);

    const n = entry.label.length;
    if (n > longest.n) longest = { label: entry.label, n };
    if (n > FAIL_LENGTH) {
      fail(`${g.id}: "${entry.label}" is ${n} chars — will not render in a cell`);
    } else if (n > WARN_LENGTH) {
      console.log(`warn ${g.id}: "${entry.label}" is ${n} chars`);
    }
  }
}

// A single grid is a single round. Too few and a session repeats itself.
if (grids.length < 20) fail(`only ${grids.length} grids — a session will repeat`);

console.log(
  `\n${grids.length} grids · ${grids.length * GRID_SIZE} cells · longest "${longest.label}" (${longest.n})`,
);
if (bad) {
  console.log(`\n${bad} problem(s).`);
  process.exit(1);
}
console.log("Every grid is 16 resolvable, renderable, non-spicy cells.");
