#!/usr/bin/env node
/*
 * Shrink background photos for the home and rail cards, and the Mafia role cards.
 *
 *   npm run backgrounds
 *
 * Every PNG in public/backgrounds and public/roles becomes a JPEG of the same name, at most
 * 1000px on its long side, quality 80, and the PNG is removed. The cards
 * dither these into two inks, so the detail a large PNG carries never shows,
 * and every byte is precached on a visitor's first load.
 *
 * A PNG with transparency is skipped: JPEG has no alpha, so it would turn
 * black. Uses macOS `sips`.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const DIRS = ["public/backgrounds", "public/roles"];
const MAX_SIDE = "1000";
const QUALITY = "80";

const sips = (...args) => execFileSync("sips", args, { encoding: "utf8" });
const prop = (file, key) =>
  sips("-g", key, file).match(new RegExp(`${key}: (\\S+)`))?.[1];
const kb = (file) => Math.round(statSync(file).size / 1000);

const pngs = DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .map((name) => ({ dir, name })),
);
if (pngs.length === 0) console.log(`No PNGs in ${DIRS.join(" or ")}.`);

for (const { dir, name } of pngs) {
  const png = join(dir, name);
  if (prop(png, "hasAlpha") === "yes") {
    console.log(`skip  ${name}: has transparency`);
    continue;
  }
  const jpg = png.replace(/\.png$/i, ".jpg");
  const before = kb(png);
  sips(
    "-Z",
    MAX_SIDE,
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    QUALITY,
    png,
    "--out",
    jpg,
  );
  unlinkSync(png);
  const size = `${prop(jpg, "pixelWidth")}x${prop(jpg, "pixelHeight")}`;
  console.log(
    `done  ${name} -> ${jpg.split("/").pop()}  ${size}  ${before}KB -> ${kb(jpg)}KB`,
  );
}
