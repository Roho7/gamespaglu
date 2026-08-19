#!/usr/bin/env node
/*
 * Guard: components may not name a colour.
 *
 *   node scripts/check-tokens.mjs
 *
 * Every colour must come from a colourway token so a screen can be recoloured
 * by swapping four variables. Raw hex values and Tailwind colour utilities are
 * how a design system quietly rots, so this fails the build instead of trusting
 * anyone to remember. Palette definitions live in the two allowed files below.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/components", "src/app", "src/content"];
const ALLOWED = new Set([
  "src/lib/colourways.ts",
  "src/app/globals.css",
  // Emblems reference token vars only; icons/manifest need literal brand hex.
  "src/app/manifest.ts",
]);

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const TW_COLOUR =
  /\b(?:bg|text|border|from|via|to|ring|fill|stroke|decoration|outline|shadow)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(tsx?|css)$/.test(path)) out.push(path);
  }
  return out;
}

/*
 * Second guard: a var(--x) that no longer exists renders as nothing, which is
 * how the scorecard sheet shipped fully transparent and unreadable after the
 * palette was renamed. Every token a component references must be defined.
 */
const css = readFileSync("src/app/globals.css", "utf8");
const DEFINED = new Set([
  ...[...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  // Set at runtime by colourwayVars(), and by base-ui's drawer internals.
  "--shadow-text",
  "--btn-field",
  "--btn-rule",
  "--btn-ink",
  "--btn-dots",
  "--drawer-content-height",
  "--drawer-content-width",
]);
const RUNTIME_PREFIXES = [
  "--drawer-",
  "--stack-",
  "--peek",
  "--nested-",
  "--color-",
  "--translate-",
  "--closed-transform",
];

let bad = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (ALLOWED.has(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes("check-tokens-ignore")) return;
      const hex = line.match(HEX);
      const tw = line.match(TW_COLOUR);
      if (hex || tw) {
        bad++;
        console.log(
          `${file}:${i + 1}  ${hex ? `raw colour ${hex[0]}` : `colour utility ${tw[0]}`}`,
        );
      }
      for (const [, token] of line.matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (DEFINED.has(token)) continue;
        if (RUNTIME_PREFIXES.some((p) => token.startsWith(p))) continue;
        bad++;
        console.log(
          `${file}:${i + 1}  undefined token ${token} — renders as nothing`,
        );
      }
    });
  }
}

console.log(
  bad === 0
    ? "No raw colours and no undefined tokens in components."
    : `\n${bad} raw colour${bad === 1 ? "" : "s"} found. Use colourway tokens (--field, --frame, --ink-on-field, --highlight) or page tokens (--ground, --band).`,
);
process.exit(bad === 0 ? 0 : 1);
