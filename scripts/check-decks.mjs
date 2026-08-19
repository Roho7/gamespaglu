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
const ALL_LANGS = ["hi", "ta", "te", "ml", "kn"];
const ERAS = ["both", "classic", "modern"];

const uniq = (xs) => [...new Set(xs)];
const availableCountries = (cat) => uniq(DATA[cat].flatMap((e) => e.countries));
const availableLanguages = (cat) => uniq(DATA[cat].flatMap((e) => e.languages ?? []));
// Mirrors src/lib/entries.ts: a type chip is only offered when it has entries
// under the other active filters.
const availableTypes = (cat, era = "both") =>
  uniq(
    DATA[cat]
      .filter((e) => era === "both" || !e.era || e.era === "evergreen" || e.era === era)
      .flatMap((e) => e.types ?? []),
  );

function filterPool(cat, { countries, languages = ALL_LANGS, types, era = "both" } = {}) {
  const all = DATA[cat];
  if (!HAS_REGION[cat]) return all;
  const cs = countries ?? ["in", "us"];
  const ts = types ?? availableTypes(cat);
  return all.filter((e) => {
    if (!e.countries.some((c) => cs.includes(c))) return false;
    if (e.languages?.length && !e.languages.some((l) => languages.includes(l))) return false;
    if (e.types?.length && !e.types.some((t) => ts.includes(t))) return false;
    if (era !== "both" && e.era && e.era !== "evergreen" && e.era !== era) return false;
    return true;
  });
}

let bad = 0;
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
  for (const l of availableLanguages(cat)) {
    const n = filterPool(cat, { countries: ["in"], languages: [l] }).length;
    if (n === 0) fail(`${cat}/india+${l}`);
  }
}

console.log("-- every type, alone, in every era --");
for (const cat of Object.keys(HAS_TYPES)) {
  for (const era of ERAS) {
    // Only combinations the UI can actually produce: a chip that isn't offered
    // under this era can't be selected under it.
    for (const t of availableTypes(cat, era)) {
      const n = filterPool(cat, { types: [t], era }).length;
      if (n === 0) fail(`${cat}/${t}/${era} (default countries)`);
      else if (n < 5) console.log(`thin ${cat}/${t}/${era} -> ${n}`);
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
