#!/usr/bin/env node
/*
 * Refreshes the curated word lists. Run by hand, never at request time.
 *
 *   TMDB_API_KEY=... node scripts/build-data.mjs movies
 *   node scripts/build-data.mjs celebrities            (Wikidata, no key)
 *
 * Output goes to shared/data/<bucket>.candidates.json — NOT straight into the
 * shipped list. The human review pass is the step that makes this product
 * good: cut anyone the room won't recognise, then merge into
 * shared/data/<bucket>.json yourself.
 */
import { writeFileSync } from "node:fs";

const BUCKET = process.argv[2];
const TMDB = process.env.TMDB_API_KEY;

const LANGS = { hi: "in", ta: "in", te: "in", ml: "in", kn: "in" };
const REGIONS = [
  { country: "us", lang: "en" },
  { country: "gb", lang: "en" },
  { country: "kr", lang: "ko" },
  { country: "jp", lang: "ja" },
];

async function tmdb(path, params) {
  if (!TMDB) throw new Error("TMDB_API_KEY is not set");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
  return res.json();
}

async function movies() {
  const out = [];
  const pull = async (lang, country, pages = 3) => {
    for (let page = 1; page <= pages; page++) {
      const data = await tmdb("/discover/movie", {
        with_original_language: lang,
        sort_by: "vote_count.desc",
        "vote_count.gte": "500",
        page: String(page),
      });
      for (const m of data.results ?? []) {
        out.push({
          label: m.title,
          countries: [country],
          year: m.release_date ? Number(m.release_date.slice(0, 4)) : undefined,
          _votes: m.vote_count,
        });
      }
    }
  };
  for (const lang of Object.keys(LANGS)) await pull(lang, "in");
  for (const r of REGIONS) await pull(r.lang, r.country);
  return out;
}

/* Celebrity fame is not only film fame — cricketers, singers and politicians
 * matter as much in an Indian room, and TMDB has none of them. Wikidata does. */
const SPARQL = `
SELECT ?name (COUNT(?sitelink) AS ?fame) WHERE {
  ?person wdt:P31 wd:Q5 ;
          wdt:P27 ?country ;
          rdfs:label ?name .
  VALUES ?country { wd:Q668 wd:Q30 wd:Q145 wd:Q884 wd:Q17 }
  ?person wdt:P106 ?occupation .
  VALUES ?occupation { wd:Q33999 wd:Q12299841 wd:Q177220 wd:Q82955 wd:Q937857 wd:Q245068 }
  ?sitelink schema:about ?person .
  FILTER(LANG(?name) = "en")
}
GROUP BY ?name
HAVING(COUNT(?sitelink) > 40)
ORDER BY DESC(?fame)
LIMIT 600`;

async function celebrities() {
  const res = await fetch(
    "https://query.wikidata.org/sparql?format=json&query=" +
      encodeURIComponent(SPARQL),
    { headers: { "User-Agent": "gamespaglu-data/1.0 (build script)" } },
  );
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  const json = await res.json();
  return json.results.bindings.map((b) => ({
    label: b.name.value,
    _fame: Number(b.fame.value),
  }));
}

const RUNNERS = { movies, celebrities };

const run = RUNNERS[BUCKET];
if (!run) {
  console.error(`usage: node scripts/build-data.mjs <${Object.keys(RUNNERS).join("|")}>`);
  process.exit(1);
}

const rows = await run();
// Dedupe on label, keep the most famous version of each.
const seen = new Map();
for (const r of rows) if (!seen.has(r.label)) seen.set(r.label, r);
const result = [...seen.values()];

const path = `shared/data/${BUCKET}.candidates.json`;
writeFileSync(path, JSON.stringify(result, null, 1));
console.log(
  `${result.length} candidates → ${path}\nReview by hand before merging into shared/data/${BUCKET}.json.`,
);
