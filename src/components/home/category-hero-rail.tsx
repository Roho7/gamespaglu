"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORY_LIST } from "@/lib/deck/categories";
import { paletteById, theme } from "@/lib/palettes";
import { blip } from "@/lib/sound-and-haptics";
import { VineMarquee } from "@/components/stitch/vine-marquee";
import { PixelChevron } from "@/components/stitch/pixel-chevron";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { DitheredPhoto } from "@/components/home/dithered-photo";

/**
 * The Who Am I? screen: one full-bleed label per category, swiped sideways. Each card carries its own palette, so the whole screen changes
 * colour as you swipe — that IS the wayfinding, which is why the
 * one-accent-per-screen rule is suspended here.
 *
 * Native scroll-snap, no carousel library.
 */
export function CategoryHeroRail() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const i = Math.round(rail.scrollLeft / rail.clientWidth);
    setIndex((prev) => {
      const next = Math.max(0, Math.min(CATEGORY_LIST.length - 1, i));
      if (next !== prev) blip();
      return next;
    });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => rail.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const active = CATEGORY_LIST[index];

  const goTo = (i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: i * rail.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative h-full">
      <div ref={railRef} className="rail h-full">
        {CATEGORY_LIST.map((c) => {
          const palette = paletteById(c.palette);
          return (
            <div
              key={c.id}
              {...theme(palette)}
              className="mb-label mb-label-bleed h-full"
            >
              <div className="relative flex min-h-0 flex-1 flex-col">
                {c.background ? (
                  <DitheredPhoto
                    image={c.background}
                    palette={palette}
                    className="absolute inset-0"
                  />
                ) : null}
                <div className="flex h-4 text-[var(--cw-highlight)] absolute inset-x-0 top-0">
                  <VineMarquee />
                </div>
                <div className="flex h-4 text-[var(--cw-highlight)] absolute inset-x-0 bottom-0">
                  <VineMarquee direction="right" />
                </div>
              </div>

              <Link href={`/who-am-i/${c.id}`} className="mb-band-action p-10">
                <StitchBorder dithered className="inset-3" />
                <span className="text-sm font-light">Generate Random </span>
                <span className="mb-display-sm text-5xl">{c.label}</span>
              </Link>
            </div>
          );
        })}
      </div>

      <div
        {...theme(active.palette)}
        className="pointer-events-none absolute inset-0 z-20 text-[var(--cw-highlight)]"
      >
        {index > 0 ? (
          <button
            type="button"
            aria-label={`Previous: ${CATEGORY_LIST[index - 1].label}`}
            onClick={() => goTo(index - 1)}
            className="pointer-events-auto absolute top-1/2 left-1 -translate-y-1/2 p-3"
          >
            <PixelChevron direction="left" />
          </button>
        ) : null}

        {index < CATEGORY_LIST.length - 1 ? (
          <button
            type="button"
            aria-label={`Next: ${CATEGORY_LIST[index + 1].label}`}
            onClick={() => goTo(index + 1)}
            className="pointer-events-auto absolute top-1/2 right-1 -translate-y-1/2 p-3"
          >
            <PixelChevron direction="right" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
