#!/usr/bin/env node
/*
 * Refreshes the curated word lists. Run by hand, never at request time.
 *
 *   TMDB_API_KEY=... node scripts/build-data.mjs movies
 *   node scripts/build-data.mjs celebrities            (Wikidata, no key)
 *   node scripts/build-data.mjs images                 (Wikidata, no key)
 *
 * Word lists go to shared/data/<bucket>.candidates.json — NOT straight into
 * the shipped list. The human review pass is the step that makes this product
 * good: cut anyone the room won't recognise, then merge into
 * shared/data/<bucket>.json yourself.
 *
 * `images` matches every shipped entry to a Wikidata item and its main image
 * (P18, always a freely licensed Commons file). It writes shared/data/images.json,
 * which the app reads, and images.audit.json with each match's Wikidata item
 * and description so a wrong match is quick to spot and delete.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

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

const USER_AGENT = "gamespaglu-data/1.0 (https://gamespaglu.com; build script)";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const WIKIPEDIA = "https://en.wikipedia.org/w/api.php";

const CACHE_FILE = "node_modules/.cache/gamespaglu-wikidata.json";
const cache = (() => {
  try {
    return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
})();
const saveCache = () => {
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
};

const wikidata = (params) => cachedApi(WIKIDATA, params);
const wikipedia = (params) => cachedApi(WIKIPEDIA, params);

async function cachedApi(base, params) {
  const key = `${base}?${new URLSearchParams(params)}`;
  if (cache[key]) return cache[key];
  const json = await fetchApi(base, params);
  cache[key] = json;
  return json;
}

async function fetchApi(base, params) {
  const url = new URL(base);
  for (const [k, v] of Object.entries({ format: "json", ...params })) url.searchParams.set(k, v);
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return res.json();
    if (attempt === 8) throw new Error(`${url.host} ${res.status} on ${params.action}`);
    const wait = Number(res.headers.get("retry-after")) || 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}

const NOT_A_THING = new Set([
  "Q4167410", "Q101352", "Q202444", "Q13442814", "Q482994", "Q134556", "Q7366",
  "Q215380", "Q5633421", "Q11424", "Q24869", "Q5398426", "Q4830453", "Q43229",
]);
const HUMAN = "Q5";
const FILM = new Set(["Q11424", "Q24869", "Q202866", "Q229390", "Q506240", "Q17123180"]);
const IMAGE_FILE = /\.(jpe?g|png|svg|gif|webp)$/i;

const ids = (claims, p) =>
  (claims?.[p] ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
const yearOf = (claims) => {
  const t = claims?.P577?.[0]?.mainsnak?.datavalue?.value?.time;
  return t ? Number(t.slice(1, 5)) : undefined;
};

const has = (item, p) => (item.claims?.[p]?.length ?? 0) > 0;
const isTaxon = (item) => has(item, "P171") || has(item, "P225");
const isPlace = (item) => has(item, "P625");
const isKind = (item) => has(item, "P279");
const CHARACTER_TYPES = new Set(["cartoon", "anime", "superhero"]);

const describe = (item) => item.descriptions?.en?.value ?? "";
const ANIMAL_WORDS =
  /mammal|bird|animal|fish|insect|reptile|amphibian|species|breed|creature|snake|spider|feline|canine|rodent|primate|whale|shark|cattle|livestock|poultry|crustacean|mollusc|arachnid/i;
const NOT_A_PERSON =
  /\b(team|club|organi[sz]ation|league|medal|award|order of|city|town|prefecture|river|village|concept|level of)\b/i;
const NOT_AN_OBJECT = /geolog|landform|mountain|mineral|rock formation|company|disambiguation/i;

/** What a Wikidata item must be to stand in for an entry of each category. */
const FITS = {
  celebrity: (kinds, item) =>
    !kinds.some((k) => NOT_A_THING.has(k)) &&
    !isPlace(item) &&
    !isTaxon(item) &&
    !isKind(item) &&
    !NOT_A_PERSON.test(describe(item)),
  movie: (kinds, item, entry) =>
    kinds.some((k) => FILM.has(k)) &&
    (!entry.year || Math.abs((yearOf(item.claims) ?? entry.year) - entry.year) <= 1),
  place: (kinds, item) =>
    isPlace(item) && !kinds.includes(HUMAN) && !kinds.some((k) => NOT_A_THING.has(k)),
  animal: (kinds, item) =>
    (isTaxon(item) || (isKind(item) && ANIMAL_WORDS.test(describe(item)))) &&
    !isPlace(item) &&
    !kinds.includes(HUMAN) &&
    !kinds.some((k) => NOT_A_THING.has(k)),
  object: (kinds, item) =>
    isKind(item) &&
    !isTaxon(item) &&
    !isPlace(item) &&
    !kinds.includes(HUMAN) &&
    !kinds.some((k) => NOT_A_THING.has(k)) &&
    !NOT_AN_OBJECT.test(describe(item)),
};

const slug = (label) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Commons thumbnail path, relative to /wikipedia/commons/thumb/. */
function thumbPath(file) {
  const name = file.replace(/ /g, "_");
  const md5 = createHash("md5").update(name).digest("hex");
  return `${md5[0]}/${md5.slice(0, 2)}/${name}`;
}

function shippedEntries() {
  const read = (f) => JSON.parse(readFileSync(`shared/data/${f}.json`, "utf8"));
  const rows = (category, list) =>
    list.map((e) => (typeof e === "string" ? { label: e } : e)).map((e) => ({ category, ...e }));
  return [
    ...rows("celebrity", read("celebrities")),
    ...rows("movie", read("movies")),
    ...rows("place", read("places")),
    ...rows("animal", read("animals")),
    ...rows("object", read("objects")),
  ];
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/**
 * The English Wikipedia article titled exactly like the entry is the best first
 * guess: "Cat" is the animal and "Queen Elizabeth II" redirects to the person,
 * where a Wikidata search ranks a CT scan and a medal first. Disambiguation
 * pages are skipped, so an ambiguous title falls back to search.
 */
async function wikipediaItems(labels) {
  const found = new Map();
  for (let i = 0; i < labels.length; i += 50) {
    const batch = labels.slice(i, i + 50);
    const res = await wikipedia({
      action: "query",
      prop: "pageprops",
      ppprop: "wikibase_item|disambiguation",
      redirects: "1",
      titles: batch.join("|"),
    });
    const q = res.query ?? {};
    const hop = (from, list) => list?.find((x) => x.from === from)?.to ?? from;
    const pages = Object.values(q.pages ?? {});
    for (const label of batch) {
      const title = hop(hop(label, q.normalized), q.redirects);
      const page = pages.find((p) => p.title === title);
      const props = page?.pageprops;
      if (props?.wikibase_item && props.disambiguation === undefined) {
        found.set(label, props.wikibase_item);
      }
    }
  }
  return found;
}

async function images() {
  const entries = shippedEntries();
  const titled = await wikipediaItems([...new Set(entries.map((e) => e.label))]);
  let done = 0;
  const searches = await pool(entries, 2, async (entry) => {
    const res = await wikidata({
      action: "wbsearchentities",
      search: entry.label,
      language: "en",
      type: "item",
      limit: "7",
    });
    if (++done % 100 === 0) {
      console.log(`searched ${done}/${entries.length}`);
      saveCache();
    }
    const searched = (res.search ?? []).map((r) => r.id);
    const exact = titled.get(entry.label);
    return exact ? [exact, ...searched.filter((id) => id !== exact)] : searched;
  });

  const allIds = [...new Set(searches.flat())];
  const items = {};
  for (let i = 0; i < allIds.length; i += 50) {
    const res = await wikidata({
      action: "wbgetentities",
      ids: allIds.slice(i, i + 50).join("|"),
      props: "claims|descriptions",
      languages: "en",
    });
    Object.assign(items, res.entities);
  }
  saveCache();

  const shipped = {};
  const audit = {};
  const misses = {};
  entries.forEach((entry, i) => {
    const key = `${entry.category}:${slug(entry.label)}`;
    const candidates = searches[i].map((id) => ({ id, item: items[id] })).filter((c) => c.item);
    const usable = candidates.filter(({ item }) => {
      const file = item.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      return file && IMAGE_FILE.test(file) && FITS[entry.category](ids(item.claims, "P31"), item, entry);
    });
    const wantsHuman =
      entry.category === "celebrity" &&
      !(entry.types ?? []).some((t) => CHARACTER_TYPES.has(t));
    const human = ({ item }) => ids(item.claims, "P31").includes(HUMAN);
    const pick =
      entry.category === "celebrity"
        ? usable.find((c) => human(c) === wantsHuman) ?? usable[0]
        : usable[0];
    if (!pick) {
      misses[entry.category] = (misses[entry.category] ?? 0) + 1;
      return;
    }
    const file = pick.item.claims.P18[0].mainsnak.datavalue.value;
    shipped[key] = thumbPath(file);
    audit[key] = {
      label: entry.label,
      wikidata: pick.id,
      description: pick.item.descriptions?.en?.value ?? "",
      file,
    };
  });

  writeFileSync("shared/data/images.json", JSON.stringify(shipped, null, 1) + "\n");
  writeFileSync("shared/data/images.audit.json", JSON.stringify(audit, null, 1) + "\n");
  const counts = {};
  for (const e of entries) counts[e.category] = (counts[e.category] ?? 0) + 1;
  for (const [category, total] of Object.entries(counts)) {
    const miss = misses[category] ?? 0;
    console.log(`${category.padEnd(10)} ${total - miss}/${total} matched`);
  }
  console.log(
    `${Object.keys(shipped).length} images → shared/data/images.json\nSkim shared/data/images.audit.json and delete wrong matches from both files.`,
  );
}

function writeCandidates(bucket, rows) {
  const seen = new Map();
  for (const r of rows) if (!seen.has(r.label)) seen.set(r.label, r);
  const result = [...seen.values()];
  const path = `shared/data/${bucket}.candidates.json`;
  writeFileSync(path, JSON.stringify(result, null, 1));
  console.log(
    `${result.length} candidates → ${path}\nReview by hand before merging into shared/data/${bucket}.json.`,
  );
}

const RUNNERS = {
  movies: async () => writeCandidates("movies", await movies()),
  celebrities: async () => writeCandidates("celebrities", await celebrities()),
  images,
};

const run = RUNNERS[BUCKET];
if (!run) {
  console.error(`usage: node scripts/build-data.mjs <${Object.keys(RUNNERS).join("|")}>`);
  process.exit(1);
}

await run();
