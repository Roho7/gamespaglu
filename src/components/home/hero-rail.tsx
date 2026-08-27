"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Marquee } from "@/components/mb/marquee";
import { Sticker } from "@/components/mb/sticker";
import { CATEGORY_LIST } from "@/lib/categories";
import { colourwayById, colourwayVars } from "@/lib/colourways";
import { blip } from "@/lib/feedback";

/**
 * The first screen: one full-bleed matchbox label per category, swiped
 * sideways. Each card carries its own colourway, so the whole screen changes
 * colour as you swipe — that IS the wayfinding, which is why the
 * one-accent-per-screen rule is suspended here.
 *
 * Native scroll-snap, no carousel library.
 */
export function HeroRail() {
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
        {CATEGORY_LIST.map((c) => (
          <div
            key={c.id}
            style={colourwayVars(colourwayById(c.colourway))}
            className="mb-label mb-label-bleed h-full"
          >
            {/* caption, then the stamp, then the name — the marquee gets its
                own box so the type never lands on top of the starburst. */}
            <div className="mb-label-field relative flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-5 pt-14">
              <p className="mb-caps text-[0.6rem] opacity-75">
                Guess my {c.noun}
              </p>

              <div className="relative flex h-[min(72vw,34vh)] w-[min(72vw,34vh)] shrink-0 items-center justify-center">
                <Marquee className="absolute inset-0 text-[var(--highlight)]" />
                <Sticker category={c.id} className="relative z-10 h-3/5 w-3/5" />
              </div>

              <h3 className="mb-display text-5xl">{c.label}</h3>
            </div>

            <div className="mb-band px-4 pt-3 pb-9 bg-transparent">
              <Link
                href={`/who-am-i/${c.id}`}
                className="mb-btn mb-btn-primary w-full max-w-sm text-xl"
              >
                Play {c.label.toLowerCase()}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/*
        Affordances live outside the scrolling element so they stay put, and
        they take the ACTIVE card's colourway — cream chevrons would vanish on
        the one light-ink colourway.
      */}
      <div
        style={colourwayVars(colourwayById(active.colourway))}
        className="pointer-events-none absolute inset-0 z-20 text-[var(--ink-on-field)]"
      >
        {index > 0 ? (
          <button
            type="button"
            aria-label={`Previous: ${CATEGORY_LIST[index - 1].label}`}
            onClick={() => goTo(index - 1)}
            className="pointer-events-auto absolute top-1/2 left-1 -translate-y-1/2 p-3 opacity-55 active:opacity-90"
          >
            <Chevron className="size-6 rotate-90" />
          </button>
        ) : null}

        {index < CATEGORY_LIST.length - 1 ? (
          <button
            type="button"
            aria-label={`Next: ${CATEGORY_LIST[index + 1].label}`}
            onClick={() => goTo(index + 1)}
            className="pointer-events-auto absolute top-1/2 right-1 -translate-y-1/2 p-3 opacity-55 active:opacity-90"
          >
            <Chevron className="size-6 -rotate-90" />
          </button>
        ) : null}

        <div className="absolute inset-x-0 bottom-36 flex justify-center">
          <Chevron className="animate-bob size-5" />
        </div>
      </div>
    </div>
  );
}

/** Points down by default; rotate it for the sideways affordances. */
function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className}>
      <path
        d="M5 9l7 7 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
