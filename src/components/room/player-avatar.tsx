"use client";

import { useMemo } from "react";
import { Avatar, Style } from "@dicebear/core";
import adventurerNeutral from "@dicebear/styles/adventurer-neutral.json";
import type { Palette } from "@/lib/palettes";
import { cn } from "@/lib/utils";

const FACE = new Style(adventurerNeutral);

const ink = (hex: string) => [hex.replace("#", "")];

/**
 * A face for a player, drawn on the device from their name, so the same name gets the same face in
 * every game and nothing is fetched. Every colour slot takes one of the palette's inks: skin is the
 * loud base, lines are the near-black, whites the highlight, so a face prints like the rest of the
 * screen and changes with it.
 */
export function PlayerAvatar({
  seed,
  palette,
  className,
}: {
  seed: string;
  palette: Palette;
  className?: string;
}) {
  const src = useMemo(
    () =>
      new Avatar(FACE, {
        seed,
        backgroundColor: ink(palette.base),
        inkColor: ink(palette.shadow),
        eyesColor: ink(palette.shadow),
        glassesColor: ink(palette.shadow),
        scleraColor: ink(palette.highlight),
        teethColor: ink(palette.highlight),
        lipsColor: ink(palette.secondary),
        tongueColor: ink(palette.secondary),
        throatColor: ink(palette.primary),
        uvulaColor: ink(palette.primary),
      }).toDataUri(),
    [seed, palette],
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden draggable={false} className={cn("select-none", className)} />
  );
}
