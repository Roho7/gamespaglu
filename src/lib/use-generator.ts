"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated, usePersisted } from "./use-persisted";
import { clampRange, drawEntry, drawNumber, filterPool } from "./draw";
import { availableTypes } from "./entries";
import { DEFAULT_COUNTRIES } from "./countries";
import { ALL_TYPES } from "./celeb-types";
import { primeAudio, revealHit, tick } from "./feedback";
import { type Colourway, randomColourway } from "./colourways";
import type { CategoryId, CountryKey, EraFilter, TypeKey } from "./types";

export type Phase = "idle" | "countdown" | "reveal";

const COUNTDOWN_FROM = 3;

/**
 * `v` is a migration stamp, not a preference. Bump it whenever a stored shape
 * stops meaning what it used to.
 */
const PREFS_VERSION = 2;

type Prefs = {
  v: number;
  countries: CountryKey[];
  types: TypeKey[];
  era: EraFilter;
  spicy: boolean;
  min: number;
  max: number;
};

const DEFAULT_PREFS: Prefs = {
  v: PREFS_VERSION,
  countries: [...DEFAULT_COUNTRIES],
  // Everything on by default: a mixed deck makes "am I a real person?" the
  // best opening question in the game.
  types: [...ALL_TYPES],
  // Off. A group opts in; nobody gets Epstein by accident.
  spicy: false,
  era: "both",
  min: 1,
  max: 100,
};

/**
 * Stored preferences are migrated on *read*, purely — never copied into state
 * inside an effect (see use-persisted).
 *
 * v1 → v2 dropped the Indian-language axis and moved the country default from
 * India+USA to the whole deck. Both halves matter: a saved `languages: ["ta"]`
 * would now match nothing, and a saved `countries: ["in", "us"]` was never a
 * choice anybody made — it was the old default that got written to storage the
 * first time any other setting was touched. Carrying either one forward leaves
 * a returning player on a silently narrowed deck, which is the empty-pool bug
 * this repo has already shipped once.
 */
function migrate(stored: Partial<Prefs>): Prefs {
  if (stored.v === PREFS_VERSION) return { ...DEFAULT_PREFS, ...stored };
  // Anything older: keep only what still means the same thing.
  // `spicy` is deliberately not carried across: a new axis defaults to off, and
  // DEFAULT_PREFS supplies it for v2 records that predate it.
  const { types, era, min, max } = stored;
  return {
    ...DEFAULT_PREFS,
    ...(types?.length ? { types } : {}),
    ...(era ? { era } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  };
}

/**
 * One engine, two doors: the full-screen Who Am I? flow and the compact
 * standalone generator pages both run on this.
 */
export function useGenerator(category: CategoryId, opts?: { countdown?: boolean }) {
  const useCountdown = opts?.countdown ?? true;
  const prefKey = `prefs:${category}`;

  const [stored, setStored] = usePersisted<Partial<Prefs>>(prefKey, {});
  const hydrated = useHydrated();
  const prefs = useMemo<Prefs>(() => migrate(stored), [stored]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [label, setLabel] = useState<string | null>(null);
  const [sub, setSub] = useState<string | undefined>();
  // Null until the first draw, so the idle screen still wears the category's
  // own colourway and the picker's wayfinding survives.
  const [colourway, setColourway] = useState<Colourway | null>(null);
  const lastColourwayId = useRef<string | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const savePrefs = useCallback(
    (next: Partial<Prefs>) => {
      const merged = { ...prefs, ...next };

      // Changing era or country can strand a type selection with nothing behind
      // it — Internet has no classic entries, for instance. Prune rather than
      // let the deck empty out.
      if (category !== "number") {
        const offered = availableTypes(category, {
          countries: merged.countries,
          era: merged.era,
          spicy: merged.spicy,
        });
        if (offered.length > 0) {
          const kept = merged.types.filter((t) => offered.includes(t));
          merged.types = kept.length > 0 ? kept : offered;
        }
      }

      setStored(merged);
    },
    [category, prefs, setStored],
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const poolSize = useMemo(() => {
    if (category === "number") {
      const [lo, hi] = clampRange(prefs.min, prefs.max);
      return hi - lo + 1;
    }
    return filterPool(category, {
      countries: prefs.countries,
      types: prefs.types,
      era: prefs.era,
      spicy: prefs.spicy,
    }).length;
  }, [category, prefs]);

  const pick = useCallback(() => {
    if (category === "number") {
      const [lo, hi] = clampRange(prefs.min, prefs.max);
      return drawNumber(lo, hi);
    }
    return drawEntry(category, {
      countries: prefs.countries,
      types: prefs.types,
      era: prefs.era,
      spicy: prefs.spicy,
    });
  }, [category, prefs]);

  const generate = useCallback(() => {
    clearTimers();
    primeAudio(); // must happen inside the tap, or iOS stays silent

    const result = pick();
    if (!result) return;

    // Recolour at the start of the round, so the countdown already carries the
    // new inks and the reveal lands on them.
    const next = randomColourway(lastColourwayId.current);
    lastColourwayId.current = next.id;
    setColourway(next);

    if (!useCountdown) {
      setLabel(result.label);
      setSub(result.sub);
      setPhase("reveal");
      revealHit();
      return;
    }

    setPhase("countdown");
    setCount(COUNTDOWN_FROM);
    tick();

    for (let i = 1; i < COUNTDOWN_FROM; i++) {
      timers.current.push(
        setTimeout(() => {
          setCount(COUNTDOWN_FROM - i);
          tick();
        }, i * 1000),
      );
    }
    // Three seconds is the window to get the phone onto your forehead.
    timers.current.push(
      setTimeout(() => {
        setLabel(result.label);
        setSub(result.sub);
        setPhase("reveal");
        revealHit();
      }, COUNTDOWN_FROM * 1000),
    );
  }, [clearTimers, pick, useCountdown]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setLabel(null);
    setSub(undefined);
    setColourway(null);
  }, [clearTimers]);

  return {
    prefs,
    savePrefs,
    hydrated,
    phase,
    count,
    label,
    sub,
    colourway,
    poolSize,
    generate,
    reset,
  };
}
