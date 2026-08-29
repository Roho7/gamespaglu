#!/usr/bin/env node
/*
 * Deck sanity check — run after touching src/data or the filter logic.
 *
 *   node scripts/check-decks.mjs
 *
 * Every category, and every filter combination the UI actually offers, must
 * produce a non-empty deck. An empty deck is invisible in a screenshot: the
 * Generate button simply does nothing. Animals and objects shipped broken
 * exactly that way (all tagged "worldwide" while the default filter was
 * India+USA), and "Worldwide" was offered on movies where no entry carries it.
 *
 * The default is now every country, so "defaults" below is the whole deck. The
 * per-country pass is what actually earns its keep.
 */
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(`src/data/${f}.json`, "utf8"));
const DATA = {
  animal: load("animals").map((l) => ({ label: l, countries: ["worldwide"] })),
  object: load("objects").map((l) => ({ label: l, countries: ["worldwide"] })),
  place: load("places"),
  movie: load("movies"),
  celebrity: load("celebrities"),
};
const HAS_REGION = { celebrity: true, movie: true, place: true, animal: false, object: false };
const HAS_TYPES = { celebrity: true };
const ERAS = ["both", "classic", "modern"];

const uniq = (xs) => [...new Set(xs)];
// eslint-disable-next-line no-unused-vars
const availableCountries = (cat) => uniq(DATA[cat].flatMap((e) => e.countries));
// Mirrors src/lib/entries.ts: a type chip is only offered when it has entries
// under the other active filters.
const availableTypes = (cat, era = "both", spicy = false) =>
  uniq(
    DATA[cat]
      .filter((e) => spicy || !e.spicy)
      .filter((e) => era === "both" || !e.era || e.era === "evergreen" || e.era === era)
      .flatMap((e) => e.types ?? []),
  );

function filterPool(cat, { countries, types, era = "both", spicy = false } = {}) {
  const all = DATA[cat];
  if (!HAS_REGION[cat]) return all;
  const cs = countries ?? availableCountries(cat);
  const ts = types ?? availableTypes(cat);
  return all.filter((e) => {
    if (e.spicy && !spicy) return false;
    if (!e.countries.some((c) => cs.includes(c))) return false;
    if (e.types?.length && !e.types.some((t) => ts.includes(t))) return false;
    if (era !== "both" && e.era && e.era !== "evergreen" && e.era !== era) return false;
    return true;
  });
}

let bad = 0;
// "Leaders" was folded into "Icons". A stray `politics` type would be filtered
// against a chip that no longer exists, i.e. an entry nobody can ever draw.
for (const [cat, rows] of Object.entries(DATA)) {
  const stray = rows.filter((e) => (e.types ?? []).includes("politics"));
  if (stray.length) {
    console.log(`FAIL ${cat}: ${stray.length} entries still typed \`politics\``);
    bad++;
  }
}
// The language axis is gone (CLAUDE.md, "popularity over locality"). A stray
// `languages` key in the data would be silently ignored by the app, so fail
// loudly instead of letting it rot.
for (const [cat, rows] of Object.entries(DATA)) {
  const stray = rows.filter((e) => e.languages);
  if (stray.length) {
    console.log(`FAIL ${cat}: ${stray.length} entries still carry \`languages\``);
    bad++;
  }
}

const fail = (msg) => {
  console.log(`FAIL ${msg}`);
  bad++;
};

console.log("-- defaults --");
for (const cat of Object.keys(DATA)) {
  const n = filterPool(cat).length;
  console.log(`${(n > 0 ? "ok  " : "FAIL")} ${cat.padEnd(10)} default -> ${String(n).padStart(3)}`);
  if (n === 0) bad++;
}

console.log("\n-- every offered country, alone --");
for (const cat of Object.keys(HAS_REGION).filter((c) => HAS_REGION[c])) {
  for (const c of availableCountries(cat)) {
    const n = filterPool(cat, { countries: [c] }).length;
    if (n === 0) fail(`${cat}/${c}`);
  }
}

console.log("-- every type, alone, in every era --");
for (const cat of Object.keys(HAS_TYPES)) {
  for (const era of ERAS) {
    // Only combinations the UI can actually produce: a chip that isn't offered
    // under this era (or on this side of the spicy switch) can't be selected.
    for (const spicy of [false, true]) {
      for (const t of availableTypes(cat, era, spicy)) {
        const n = filterPool(cat, { types: [t], era, spicy }).length;
        const tag = `${cat}/${t}/${era}/${spicy ? "spicy" : "clean"}`;
        if (n === 0) fail(`${tag} (default countries)`);
        else if (n < 5) console.log(`thin ${tag} -> ${n}`);
      }
    }
  }
  console.log(
    availableTypes(cat)
      .map((t) => `${t}:${filterPool(cat, { types: [t] }).length}`)
      .join("  "),
  );
}

console.log(
  bad === 0
    ? "\nAll offered combinations produce a playable deck."
    : `\n${bad} broken combinations`,
);
process.exit(bad === 0 ? 0 : 1);
