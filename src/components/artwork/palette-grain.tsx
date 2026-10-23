"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import type { Palette } from "@/lib/palettes";
import { cn } from "@/lib/utils";

const TONES = {
  field: (p: Palette) => ({
    colorBack: p.base,
    colors: [p.highlight, p.secondary, p.base],
    shape: "wave" as const,
    softness: 1,
    intensity: 0.25,
    scale: 1,
    noise: 0.3,
    frame: 100,
  }),
  ink: (p: Palette) => ({
    colorBack: p.shadow,
    colors: [p.shadow, p.primary, p.secondary],
    shape: "wave" as const,
    scale: 2,
    softness: 1,
    intensity: 0.4,
    noise: 0.6,
  }),
};

/**
 * A slow, grainy gradient in a palette's inks. `field` is the light face that
 * carries dark marks; `ink` is the dark ground under light type, with
 * `secondary` kept to the corners and away from centred text. Fills its parent
 * and ignores pointer events.
 */
export function PaletteGrain({
  palette,
  tone,
  className,
}: {
  palette: Palette;
  tone: keyof typeof TONES;
  className?: string;
}) {
  return (
    <GrainGradient
      width="100%"
      height="100%"
      className={cn("pointer-events-none", className)}
      speed={0}
      {...TONES[tone](palette)}
    />
  );
}
