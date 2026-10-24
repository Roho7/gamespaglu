#!/usr/bin/env node
/*
 * Guard: every palette has five distinct inks and is readable at its roles.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/palettes.ts", "utf8");
const blocks = [...src.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?\}/g)];

const field = (b, key) => b.match(new RegExp(`${key}:\\s*"(#[0-9a-fA-F]{6})"`))?.[1];

function channel(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const ROLES = ["base", "highlight", "secondary", "primary", "shadow"];

const RULES = [
  ["shadow", "base", 4.5, "body text on the paper, and the band"],
  ["primary", "base", 3.0, "accents and display type"],
  ["secondary", "base", 2.0, "rules and borders"],
  ["highlight", "shadow", 3.0, "the offset shadow under dark type"],
];

let bad = 0;
for (const [block, id] of blocks.map((m) => [m[0], m[1]])) {
  const inks = Object.fromEntries(ROLES.map((r) => [r, field(block, r)]));
  if (!inks.base) continue;
  const distinct = new Set(ROLES.map((r) => inks[r]?.toLowerCase())).size === ROLES.length;
  if (!distinct) bad++;
  const results = RULES.map(([fg, bg, min, why]) => {
    const r = ratio(inks[fg], inks[bg]);
    const ok = r >= min;
    if (!ok) bad++;
    return `${ok ? "ok" : "FAIL"} ${fg}/${bg} ${r.toFixed(2)}:1 (need ${min}, ${why})`;
  });
  console.log(`${id.padEnd(11)} ${distinct ? "ok" : "FAIL"} five distinct inks  ${results.join("  ")}`);
}

// Plain pages are printed in one palette, flipped: its near-black is the
// ground, its loud ink the type, and panels sit on its primary. A secondary
// button on a dark ground is exactly where this went wrong once.
const groundId = src.match(/export const GROUND = paletteById\("([^"]+)"\)/)?.[1];
const groundBlock = blocks.find((m) => m[1] === groundId)?.[0];
if (!groundBlock) {
  console.log(`\nFAIL ground palette "${groundId}" not found in palettes.ts`);
  bad++;
} else {
  const g = Object.fromEntries(ROLES.map((r) => [r, field(groundBlock, r)]));
  const GROUND_RULES = [
    ["ground type", g.base, g.shadow, 4.5],
    ["panel type", g.base, g.primary, 4.5],
    ["muted type", g.highlight, g.shadow, 3.0],
  ];
  console.log(`\nground: ${groundId}`);
  for (const [name, fg, bg, min] of GROUND_RULES) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(12)} ${r.toFixed(2)}:1 (need ${min})`);
  }
}

console.log(
  bad === 0
    ? "\nEvery colourway is readable at its declared roles."
    : `\n${bad} contrast failure${bad === 1 ? "" : "s"} — adjust the ink in src/lib/palettes.ts.`,
);
process.exit(bad === 0 ? 0 : 1);
