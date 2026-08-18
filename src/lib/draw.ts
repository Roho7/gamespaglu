import { drawIndex } from "./shuffle-bag";
import { ENTRIES } from "./entries";
import { ALL_LANGUAGES } from "./countries";
import type {
  CategoryId,
  CountryKey,
  Entry,
  Filters,
  LanguageKey,
} from "./types";

/**
 * Pure drawing logic — no React, no DOM. A server (rooms, later) can call the
 * identical functions.
 */

export const NUMBER_LIMITS = { min: -1_000_000, max: 1_000_000, maxSpan: 1_000_000 };
const BAGGED_RANGE_LIMIT = 1000;

export function filterPool(
  category: Exclude<CategoryId, "number">,
  filters: Filters,
): Entry[] {
  const all = ENTRIES[category];
  const countries = filters.countries?.length
    ? filters.countries
    : (["worldwide"] as CountryKey[]);
  const languages = filters.languages?.length ? filters.languages : ALL_LANGUAGES;

  return all.filter((e) => {
    const countryHit = e.countries.some((c) => countries.includes(c));
    if (!countryHit) return false;
    // Language chips only gate entries that carry a language (film titles,
    // film actors). Cricketers and politicians are not language-specific.
    if (e.languages?.length) {
      return e.languages.some((l) => languages.includes(l as LanguageKey));
    }
    return true;
  });
}

/** Stable identity for a pool, so the shuffle-bag resets when filters change. */
export function poolSignature(
  category: CategoryId,
  filters: Filters,
): string {
  if (category === "number") {
    return `number:${filters.min ?? 1}-${filters.max ?? 100}`;
  }
  const c = [...(filters.countries ?? [])].sort().join(",");
  const l = [...(filters.languages ?? [])].sort().join(",");
  return `${category}:${c}|${l}`;
}

export type DrawResult = {
  label: string;
  sub?: string;
  /** How many draws remain before the deck reshuffles. */
  remaining: number;
  poolSize: number;
};

export function drawEntry(
  category: Exclude<CategoryId, "number">,
  filters: Filters,
): DrawResult | null {
  const pool = filterPool(category, filters);
  if (pool.length === 0) return null;
  const sig = poolSignature(category, filters);
  const idx = drawIndex(sig, pool.length);
  const entry = pool[idx] ?? pool[0];
  return {
    label: entry.label,
    sub: entry.year ? String(entry.year) : undefined,
    remaining: 0,
    poolSize: pool.length,
  };
}

export function drawNumber(min: number, max: number): DrawResult {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const span = hi - lo + 1;

  // Small ranges get the no-repeat deck; huge ones fall back to plain random,
  // where a repeat is statistically invisible anyway.
  if (span <= BAGGED_RANGE_LIMIT) {
    const idx = drawIndex(poolSignature("number", { min: lo, max: hi }), span);
    return { label: String(lo + idx), remaining: 0, poolSize: span };
  }
  const n = lo + Math.floor(Math.random() * span);
  return { label: String(n), remaining: 0, poolSize: span };
}

export function clampRange(min: number, max: number): [number, number] {
  let lo = Math.round(Number.isFinite(min) ? min : 1);
  let hi = Math.round(Number.isFinite(max) ? max : 100);
  lo = Math.max(NUMBER_LIMITS.min, Math.min(NUMBER_LIMITS.max, lo));
  hi = Math.max(NUMBER_LIMITS.min, Math.min(NUMBER_LIMITS.max, hi));
  if (hi <= lo) hi = lo + 1;
  if (hi - lo > NUMBER_LIMITS.maxSpan) hi = lo + NUMBER_LIMITS.maxSpan;
  return [lo, hi];
}
