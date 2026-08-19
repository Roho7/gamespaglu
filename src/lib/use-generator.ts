"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHydrated, usePersisted } from "./use-persisted";
import { clampRange, drawEntry, drawNumber, filterPool } from "./draw";
import { ALL_LANGUAGES, DEFAULT_COUNTRIES } from "./countries";
import { primeAudio, revealHit, tick } from "./feedback";
import { randomPastel } from "./palette";
import type { CategoryId, CountryKey, LanguageKey } from "./types";

export type Phase = "idle" | "countdown" | "reveal";

const COUNTDOWN_FROM = 3;

type Prefs = {
  countries: CountryKey[];
  languages: LanguageKey[];
  min: number;
  max: number;
};

const DEFAULT_PREFS: Prefs = {
  countries: [...DEFAULT_COUNTRIES],
  languages: [...ALL_LANGUAGES],
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
  // own colour and the picker's wayfinding survives.
  const [accent, setAccent] = useState<string | null>(null);
  const lastHue = useRef<number | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const savePrefs = useCallback(
    (next: Partial<Prefs>) => setStored({ ...prefs, ...next }),
    [prefs, setStored],
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
    });
  }, [category, prefs]);

  const generate = useCallback(() => {
    clearTimers();
    primeAudio(); // must happen inside the tap, or iOS stays silent

    const result = pick();
    if (!result) return;

    // Recolour at the start of the round, so the countdown already carries the
    // new colour and the reveal lands on it.
    const pastel = randomPastel(lastHue.current);
    lastHue.current = pastel.hue;
    setAccent(pastel.css);

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
    setAccent(null);
  }, [clearTimers]);

  return {
    prefs,
    savePrefs,
    hydrated,
    phase,
    count,
    label,
    sub,
    accent,
    poolSize,
    generate,
    reset,
  };
}
