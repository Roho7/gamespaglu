#!/usr/bin/env node
/*
 * Deck sanity check — run after touching src/data or the filter logic.
 *
 *   node scripts/check-decks.mjs
 *
 * Every category, and every filter chip the UI actually offers, must produce a
 * non-empty deck. An empty deck is invisible in the UI: Generate just does
 * nothing. Animals and objects shipped broken exactly this way — they are all
 * tagged "worldwide" while the saved default filter is India+USA.
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
const ALL_LANGS = ["hi", "ta", "te", "ml", "kn"];

const availableCountries = (cat) => [...new Set(DATA[cat].flatMap((e) => e.countries))];
const availableLanguages = (cat) => [...new Set(DATA[cat].flatMap((e) => e.languages ?? []))];

function filterPool(cat, countries, languages = ALL_LANGS) {
  const all = DATA[cat];
  if (!HAS_REGION[cat]) return all;
  return all.filter((e) => {
    if (!e.countries.some((c) => countries.includes(c))) return false;
    if (e.languages?.length) return e.languages.some((l) => languages.includes(l));
    return true;
  });
}

let bad = 0;
for (const cat of Object.keys(DATA)) {
  const chips = HAS_REGION[cat] ? availableCountries(cat) : ["n/a"];
  const n = filterPool(cat, HAS_REGION[cat] ? ["in", "us"] : []).length;
  console.log(`${(n > 0 ? "PASS" : "FAIL").padEnd(5)} ${cat.padEnd(10)} default -> ${String(n).padStart(3)}   chips offered: ${chips.join(",")}`);
  if (n === 0) bad++;
}
console.log("\n-- every offered single chip, on its own --");
for (const cat of ["celebrity", "movie", "place"]) {
  for (const c of availableCountries(cat)) {
    const n = filterPool(cat, [c]).length;
    if (n === 0) { console.log(`FAIL ${cat}/${c}`); bad++; }
  }
  for (const l of availableLanguages(cat)) {
    const n = filterPool(cat, ["in"], [l]).length;
    if (n === 0) { console.log(`FAIL ${cat}/india+${l}`); bad++; }
  }
}
console.log(
  bad === 0
    ? "All offered combinations produce a playable deck."
    : `${bad} broken combinations`,
);
process.exit(bad === 0 ? 0 : 1);
