#!/usr/bin/env node
/*
 * Imports the hand-curated sticker set from the Obsidian note.
 *
 *   npm run stickers                 # reads the default note
 *   npm run stickers -- <path.md>    # or any other markdown file
 *
 * The note is the source of truth: headings are category names, and every
 * giphy.com URL under a heading becomes that category's set. Anything already
 * on disk that is not in the note is removed, so the note and the site can
 * never drift.
 *
 * Curation is deliberately manual. Bulk search results were mostly clip-art
 * noise; a human picking thirteen good ones beats a script picking fifty.
 *
 * A category with no stickers is fine — the drawn emblem is the fallback.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CATEGORIES,
  MAX_BYTES,
  STICKER_DIR,
  rebuildManifest,
  setMetadata,
} from "./lib/stickers-io.mjs";

const DEFAULT_NOTE =
  "/Users/roho7/Documents/MAIN/OBSIDIAN/OB_BRAIN/Cards/Gif Collection.md";
const notePath = process.argv[2] || DEFAULT_NOTE;

// Headings in the note are written naturally ("Movies"), not as category ids.
const HEADING_TO_CATEGORY = {
  celebrity: "celebrity",
  celebrities: "celebrity",
  movie: "movie",
  movies: "movie",
  place: "place",
  places: "place",
  animal: "animal",
  animals: "animal",
  object: "object",
  objects: "object",
  number: "number",
  numbers: "number",
};

if (!existsSync(notePath)) {
  console.error(`Note not found: ${notePath}`);
  process.exit(1);
}

const lines = readFileSync(notePath, "utf8").split("\n");
const wanted = Object.fromEntries(CATEGORIES.map((c) => [c, []]));
let current = null;

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  const url = line.match(/https?:\/\/\S*giphy\.com\/\S+/)?.[0];
  if (url) {
    if (!current) continue;
    // .../<id>/giphy.gif — the id is the segment before the filename.
    const id = url.split("/").filter(Boolean).at(-2);
    if (id) wanted[current].push({ id, url });
    continue;
  }

  const heading = line.replace(/^#+\s*/, "").toLowerCase().replace(/[^a-z]/g, "");
  if (HEADING_TO_CATEGORY[heading]) current = HEADING_TO_CATEGORY[heading];
}

// Rebuild from scratch: the note is the whole set, so nothing lingers.
if (existsSync(STICKER_DIR)) rmSync(STICKER_DIR, { recursive: true });

let count = 0;
let bytes = 0;
const key = process.env.GIPHY_API_KEY;

/*
 * The note links to the original file, which for stickers can be megabytes.
 * A card renders at ~120px and the whole set is precached for offline play, so
 * we look the id up and take the 200px rendition of the same sticker instead.
 * Falls back to the note's own URL if the API is unavailable.
 */
const renditions = new Map();
const allIds = CATEGORIES.flatMap((c) => wanted[c].map((i) => i.id));
let metaById = new Map();

if (key && allIds.length > 0) {
  const metaUrl = new URL("https://api.giphy.com/v1/gifs");
  metaUrl.searchParams.set("api_key", key);
  metaUrl.searchParams.set("ids", allIds.join(","));
  const res = await fetch(metaUrl);
  if (res.ok) {
    const { data = [] } = await res.json();
    metaById = new Map(data.map((g) => [g.id, g]));
    for (const gif of data) {
      const images = gif.images ?? {};
      const pick =
        images.fixed_height?.url ??
        images.fixed_height_downsampled?.url ??
        images.fixed_height_small?.url;
      if (pick) renditions.set(gif.id, pick);
    }
  } else {
    console.log(`metadata lookup failed (${res.status}); using note URLs as-is`);
  }
}

for (const category of CATEGORIES) {
  const items = wanted[category];
  if (items.length === 0) {
    console.log(`${category.padEnd(10)} — none in the note, using the emblem`);
    continue;
  }
  mkdirSync(join(STICKER_DIR, category), { recursive: true });

  for (const { id, url } of items) {
    const res = await fetch(renditions.get(id) ?? url);
    if (!res.ok) {
      console.log(`${category.padEnd(10)} FAILED ${id} (${res.status})`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(STICKER_DIR, category, `${id}.gif`), buf);
    count++;
    bytes += buf.byteLength;
    const size = `${Math.round(buf.byteLength / 1024)}KB`;
    console.log(
      `${category.padEnd(10)} ${id} ${size}${buf.byteLength > MAX_BYTES ? "  (heavy)" : ""}`,
    );
  }
}

rebuildManifest();

// Attribution: GIPHY's terms expect credit even when the file is self-hosted,
// and the source link is what makes a sticker traceable later.
if (metaById.size > 0) {
  for (const category of CATEGORIES) {
    for (const { id } of wanted[category]) {
      const gif = metaById.get(id);
      if (!gif) continue;
      setMetadata(category, `${id}.gif`, {
        title: (gif.title ?? "").trim() || "GIPHY sticker",
        url: gif.url,
      });
    }
  }
  console.log("\nmetadata and attribution links added");
}

console.log(`\n${count} stickers, ${(bytes / 1e6).toFixed(2)} MB`);
console.log(`Source of truth: ${notePath}`);
