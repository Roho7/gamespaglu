"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { theme, type Palette } from "@/lib/palettes";
import { tick } from "@/lib/sound-and-haptics";

const TICK_MS = 200;

const secondsLeft = (startsAt: number) => Math.max(0, Math.ceil((startsAt - Date.now()) / 1000));

/**
 * The run-up to a rematch, on every phone at once: the server sets when the deal lands, and each
 * phone counts down to it, ticking on every second. It lifts by itself when the night curtain takes
 * over.
 */
export function RematchCountdown({ startsAt, palette }: { startsAt: number | null; palette: Palette }) {
  const still = useReducedMotion();
  const [left, setLeft] = useState(() => (startsAt ? secondsLeft(startsAt) : 0));

  useEffect(() => {
    if (!startsAt) return;
    let last = -1;
    const id = setInterval(() => {
      const next = secondsLeft(startsAt);
      if (next !== last && next > 0) tick();
      last = next;
      setLeft(next);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [startsAt]);

  return (
    <AnimatePresence>
      {startsAt ? (
        <motion.div
          key="rematch"
          role="status"
          {...theme(palette)}
          className="mb-label mb-label-bleed fixed inset-0 z-50 m-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PaletteGrain palette={palette} tone="ink" className="absolute inset-0" />
          <div
            {...theme(palette, { flipped: true })}
            className="mb-label-field relative flex flex-col items-center justify-center gap-4 text-center"
          >
            <p className="mb-caps text-sm">New game starting in…</p>
            <AnimatePresence mode="popLayout">
              <motion.p
                key={left}
                className="mb-display mb-shadow text-[11rem] leading-none tabular-nums"
                initial={still ? { opacity: 0 } : { opacity: 0, scale: 1.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                {Math.max(left, 1)}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
