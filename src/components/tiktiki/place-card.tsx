"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eye } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import { TIKTIKI_ART, placeArt } from "@/content/place-art";
import { TIKTIKI_LABEL } from "@/content/tiktiki-copy";
import { useImageReady } from "@/lib/hooks/use-image-ready";
import { theme, type Palette } from "@/lib/palettes";
import { cn } from "@/lib/utils";
import { placeName, type PlaceId } from "@shared/protocol";

/** Null is the Tiktiki's card. */
export type CardFace = PlaceId | null;

function CardPhoto({ face, palette }: { face: CardFace; palette: Palette }) {
  const art = face ? placeArt(face) : TIKTIKI_ART;
  const ready = useImageReady(art);
  return ready ? (
    <DitheredPhoto image={art} palette={palette} grain={1} steps={4} className="absolute inset-0" />
  ) : (
    <PaletteGrain palette={palette} tone="field" className="absolute inset-0" />
  );
}

/** A card face: the picture takes 80%, the name sits in the band under it. */
export function PlaceCardFace({ face, palette, className }: { face: CardFace; palette: Palette; className?: string }) {
  return (
    <div className={cn("mb-label @container aspect-[5/7] p-2.5", className)}>
      <div
        {...theme(palette, { flipped: true })}
        className="mb-label-field relative m-0 flex h-full flex-col overflow-hidden"
      >
        <div className="relative h-[80%] shrink-0 overflow-hidden border-b-[length:var(--rule-thin)] border-[color:var(--cw-secondary)]">
          <CardPhoto face={face} palette={palette} />
        </div>
        <div className="relative flex flex-1 items-center justify-center px-4 text-center">
          <p className="mb-display mb-shadow text-[15cqw] leading-[0.95] text-balance">{face ? placeName(face) : TIKTIKI_LABEL}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The one secret on the screen, behind one button in the middle of it. Hold to see your card,
 * let go to hide it. Every phone shows the same button whatever is on the card.
 */
export function HoldToRevealPlace({ face, palette }: { face: CardFace; palette: Palette }) {
  const [held, setHeld] = useState(false);
  const still = useReducedMotion();
  const release = () => setHeld(false);

  return (
    <>
      <button
        type="button"
        aria-label="Hold to peek at your card"
        className="relative mx-auto flex aspect-[5/7] w-36 touch-none flex-col items-center justify-center gap-3 bg-[var(--loud)] text-[var(--on-loud)] shadow-[6px_6px_0_var(--shadow-ink)] transition-transform select-none active:translate-[3px] active:shadow-[2px_2px_0_var(--shadow-ink)]"
        onPointerDown={(e) => {
          setHeld(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span aria-hidden className="absolute inset-2 border border-dashed border-current opacity-70" />
        <Eye className="size-8" strokeWidth={2.5} aria-hidden />
        <span className="mb-caps text-sm">{held ? "Let go" : "Hold to peek"}</span>
      </button>

      <AnimatePresence>
        {held ? (
          <motion.div
            key="card"
            aria-live="polite"
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[color-mix(in_srgb,var(--ground)_80%,transparent)] [perspective:1000px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              initial={still ? { opacity: 0 } : { opacity: 0, rotateY: -110, scale: 0.8 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={still ? { opacity: 0 } : { opacity: 0, rotateY: 80, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <PlaceCardFace face={face} palette={palette} className="w-[min(20rem,82vw)]" />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
