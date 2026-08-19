#!/usr/bin/env node
/*
 * Guard: every colourway must be readable.
 *
 *   node scripts/check-contrast.mjs
 *
 * Saturated pairings are where this aesthetic bites — yellow on red is about
 * 3.8:1, fine for a huge word and a failure for body text. So the rules are
 * encoded rather than eyeballed:
 *   ink on field        >= 4.5:1  (body and UI text)
 *   highlight on field  >= 3.0:1  (large bold display and small-caps only)
 *   frame on field      >= 3.0:1  (the rule must be visible against the field)
 */
import { readFileSync } from "node:fs";

const src = readFileSync("src/lib/colourways.ts", "utf8");
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

const RULES = [
  ["ink", "field", 4.5, "body and UI text"],
  ["highlight", "field", 3.0, "large bold display only"],
  ["frame", "field", 3.0, "the rule against the field"],
  // The offset shadow only reads if it contrasts with the glyph it sits behind.
  ["shadow", "ink", 3.0, "the offset shadow against the ink"],
];

let bad = 0;
for (const [block, id] of blocks.map((m) => [m[0], m[1]])) {
  const inks = {
    field: field(block, "field"),
    frame: field(block, "frame"),
    ink: field(block, "ink"),
    highlight: field(block, "highlight"),
    shadow: field(block, "shadow"),
  };
  if (!inks.field) continue;
  const results = RULES.map(([fg, bg, min, why]) => {
    const r = ratio(inks[fg], inks[bg]);
    const ok = r >= min;
    if (!ok) bad++;
    return `${ok ? "ok" : "FAIL"} ${fg}/${bg} ${r.toFixed(2)}:1 (need ${min}, ${why})`;
  });
  console.log(`${id.padEnd(11)} ${results.join("  ")}`);
}

// Page grounds are static, but they carry text too — and a secondary button
// on the navy ground is exactly where this went wrong once.
const GROUNDS = [
  ["kraft ground", "#2a1c0e", "#d9c49b"],
  ["kraft panel", "#2a1c0e", "#e8d8b6"],
  ["navy ground", "#f4efe3", "#0f1a2e"],
  ["navy panel", "#f4efe3", "#1a2742"],
  ["black band", "#fff8e7", "#17110c"],
];
console.log("");
for (const [name, fg, bg] of GROUNDS) {
  const r = ratio(fg, bg);
  const ok = r >= 4.5;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name.padEnd(13)} ${r.toFixed(2)}:1 (need 4.5)`);
}

console.log(
  bad === 0
    ? "\nEvery colourway is readable at its declared roles."
    : `\n${bad} contrast failure${bad === 1 ? "" : "s"} — adjust the ink in src/lib/colourways.ts.`,
);
process.exit(bad === 0 ? 0 : 1);
