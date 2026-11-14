#!/usr/bin/env node
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(`shared/data/${f}.json`, "utf8"));
const slug = (l) =>
  l.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const GRID_SIZE = 16;
const WARN_LENGTH = 16;
const FAIL_LENGTH = 20;

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
const PACK_IDS = ["movies-tv", "people", "characters", "brands", "everyday", "world", "culture"];
const MIN_GRIDS_PER_PACK = 3;
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

  if (!PACK_IDS.includes(g.pack)) fail(`${g.id}: unknown pack "${g.pack}"`);

  if (g.cells.length !== GRID_SIZE) {
    fail(`${g.id}: ${g.cells.length} cells, expected ${GRID_SIZE}`);
  }
  const dupes = g.cells.filter((c, i) => g.cells.indexOf(c) !== i);
  if (dupes.length) fail(`${g.id}: duplicate cells ${[...new Set(dupes)].join(", ")}`);

  for (const id of g.cells) {
    const entry = byId.get(id);
    if (!entry) {
      fail(`${g.id}: no entry for id "${id}"`);
      continue;
    }
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

if (grids.length < 20) fail(`only ${grids.length} grids — a session will repeat`);

for (const pack of PACK_IDS) {
  const n = grids.filter((g) => g.pack === pack).length;
  if (n < MIN_GRIDS_PER_PACK) {
    fail(`pack "${pack}" has ${n} grid(s) — a room picking only it would repeat`);
  }
}

const perPack = PACK_IDS.map(
  (p) => `${p}:${grids.filter((g) => g.pack === p).length}`,
).join("  ");
console.log(
  `\n${grids.length} grids · ${grids.length * GRID_SIZE} cells · longest "${longest.label}" (${longest.n})`,
);
console.log(perPack);
if (bad) {
  console.log(`\n${bad} problem(s).`);
  process.exit(1);
}
console.log("Every grid is 16 resolvable, renderable, non-spicy cells.");
