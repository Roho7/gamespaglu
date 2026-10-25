"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import type { Beat } from "@/content/mafia-copy";
import { theme, type Palette } from "@/lib/palettes";

/** How long a curtain holds the screen before it lifts by itself. */
export const CURTAIN_MS = 2800;

const FADE_S = 0.35;

/**
 * The title card between beats of the game: it fades in, the title pushes slowly towards you, then
 * the whole card fades out over the screen it was announcing. Every phone raises it at the same
 * moment with the same words. A tap lifts it early.
 */
export function PhaseCurtain({
  beat,
  palette,
  onDone,
}: {
  beat: (Beat & { id: string }) | null;
  palette: Palette;
  onDone: () => void;
}) {
  const still = useReducedMotion();
  const raised = beat?.id ?? null;

  useEffect(() => {
    if (!raised) return;
    const timer = setTimeout(onDone, CURTAIN_MS);
    return () => clearTimeout(timer);
  }, [raised, onDone]);

  return (
    <AnimatePresence>
      {beat ? (
        <motion.button
          key={beat.id}
          type="button"
          aria-live="assertive"
          onClick={onDone}
          {...theme(palette)}
          className="mb-label mb-label-bleed fixed inset-0 z-50 m-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_S }}
        >
          <PaletteGrain
            palette={palette}
            tone="ink"
            className="absolute inset-0"
          />
          <span
            {...theme(palette, { flipped: true })}
            className="mb-label-field relative flex flex-col items-center justify-center gap-5 px-8 text-center"
          >
            <motion.span
              className="mb-display mb-shadow relative block text-6xl leading-[0.95]"
              initial={{ opacity: 0, scale: still ? 1 : 0.7 }}
              animate={{ opacity: 1, scale: still ? 1 : 1.08 }}
              exit={{ opacity: 0, scale: still ? 1 : 1.3 }}
              transition={{
                opacity: { duration: FADE_S },
                scale: { duration: CURTAIN_MS / 1000, ease: [0.16, 1, 0.3, 1] },
              }}
            >
              {beat.title}
            </motion.span>
            <motion.span
              className="relative block max-w-xs text-base font-semibold"
              initial={{ opacity: 0, y: still ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: FADE_S, delay: FADE_S }}
            >
              {beat.line}
            </motion.span>
          </span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
