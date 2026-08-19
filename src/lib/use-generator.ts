"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated, usePersisted } from "./use-persisted";
import { clampRange, drawEntry, drawNumber, filterPool } from "./draw";
import { availableTypes } from "./entries";
import { ALL_LANGUAGES, DEFAULT_COUNTRIES } from "./countries";
import { ALL_TYPES } from "./celeb-types";
import { primeAudio, revealHit, tick } from "./feedback";
import { type Colourway, randomColourway } from "./colourways";
import type {
  CategoryId,
  CountryKey,
  EraFilter,
  LanguageKey,
  TypeKey,
} from "./types";

export type Phase = "idle" | "countdown" | "reveal";

const COUNTDOWN_FROM = 3;

type Prefs = {
  countries: CountryKey[];
  languages: LanguageKey[];
  types: TypeKey[];
  era: EraFilter;
  min: number;
  max: number;
};

const DEFAULT_PREFS: Prefs = {
  countries: [...DEFAULT_COUNTRIES],
  languages: [...ALL_LANGUAGES],
  // Everything on by default: a mixed deck makes "am I a real person?" the
  // best opening question in the game.
  types: [...ALL_TYPES],
  era: "both",
  min: 1,
  max: 100,
};

/**
 * One engine, two doors: the full-screen Who Am I? flow and the compact
 * standalone generator pages both run on this.
 */
export function useGenerator(category: CategoryId, opts?: { countdown?: boolean }) {
  const useCountdown = opts?.countdown ?? true;
  const prefKey = `prefs:${category}`;

  const [stored, setStored] = usePersisted<Partial<Prefs>>(prefKey, {});
  const hydrated = useHydrated();
  const prefs = useMemo<Prefs>(
    () => ({ ...DEFAULT_PREFS, ...stored }),
    [stored],
  );
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
          languages: merged.languages,
          era: merged.era,
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
      languages: prefs.languages,
      types: prefs.types,
      era: prefs.era,
    }).length;
  }, [category, prefs]);

  const pick = useCallback(() => {
    if (category === "number") {
      const [lo, hi] = clampRange(prefs.min, prefs.max);
      return drawNumber(lo, hi);
    }
    return drawEntry(category, {
      countries: prefs.countries,
      languages: prefs.languages,
      types: prefs.types,
      era: prefs.era,
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
