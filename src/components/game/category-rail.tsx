"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sticker } from "@/components/mb/sticker";
import { Marquee } from "@/components/mb/marquee";
import { Label } from "@/components/mb/label";
import { CATEGORY_LIST } from "@/lib/categories";
import { colourwayById } from "@/lib/colourways";
import { blip } from "@/lib/feedback";

/**
 * The hero is a swipeable rail of matchbox labels, one per category. Each keeps
 * its own colourway here — this is the picker, and colour is the wayfinding.
 * Native scroll-snap, no carousel library.
 */
export function CategoryRail() {
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

  const goTo = (i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({ left: i * rail.clientWidth, behavior: "smooth" });
  };

  return (
    <section aria-label="Pick a category">
      <div ref={railRef} className="rail gap-3">
        {CATEGORY_LIST.map((c, i) => (
          <div
            key={c.id}
            className="h-[26rem]"
            style={{ flexBasis: "92%" }}
          >
            <Label
              colourway={c.colourway}
              tilt={i % 2 === 0 ? "left" : "right"}
              className="h-full"
              band={
                <Link
                  href={`/who-am-i/${c.id}`}
                  className="mb-btn mb-btn-primary w-full max-w-xs text-lg"
                >
                  Play {c.label.toLowerCase()}
                </Link>
              }
            >
              <div className="relative flex h-full flex-col items-center justify-between px-4 py-4 text-center">
                <p className="mb-caps relative z-10 text-[0.6rem]">
                  Guess my {c.noun}
                </p>

                <div className="relative flex flex-1 items-center justify-center">
                  <Marquee className="absolute size-[13rem] text-[var(--highlight)]" />
                  <Sticker category={c.id} className="relative size-32" />
                </div>

                <h2 className="mb-display relative z-10 text-4xl">{c.label}</h2>
              </div>
            </Label>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {CATEGORY_LIST.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Go to ${c.label}`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className="h-2.5 rounded-full border-[var(--rule-thin)] border-current transition-all"
            style={{
              width: i === index ? "1.75rem" : "0.625rem",
              background:
                i === index
                  ? colourwayById(c.colourway).field
                  : "var(--ground-soft)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
