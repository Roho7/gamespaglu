#!/usr/bin/env node
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
    const id = url.split("/").filter(Boolean).at(-2);
    if (id) wanted[current].push({ id, url });
    continue;
  }

  const heading = line.replace(/^#+\s*/, "").toLowerCase().replace(/[^a-z]/g, "");
  if (HEADING_TO_CATEGORY[heading]) current = HEADING_TO_CATEGORY[heading];
}

if (existsSync(STICKER_DIR)) rmSync(STICKER_DIR, { recursive: true });

let count = 0;
let bytes = 0;
const key = process.env.GIPHY_API_KEY;

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
    console.log(`${category.padEnd(10)} — none in the note`);
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
