"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORY_LIST } from "@/lib/categories";
import { blip } from "@/lib/feedback";

/**
 * The hero is a swipeable rail of the six things you can be — one full-bleed
 * pastel card per category, native scroll-snap, no carousel library. Swiping is
 * the browse; the pill is the commit.
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
      <div
        ref={railRef}
        className="rail -mx-4 gap-3 px-4"
        style={{ scrollPaddingInline: "1rem" }}
      >
        {CATEGORY_LIST.map((c) => (
          <article
            key={c.id}
            className="card-lift relative flex min-h-[26rem] flex-col justify-between overflow-hidden p-5 text-[var(--on-accent)]"
            style={{ background: `var(${c.accentVar})`, flexBasis: "calc(100% - 0.75rem)" }}
          >
            <p className="caps text-[0.65rem] opacity-60">
              Who am I? · {index + 1} of {CATEGORY_LIST.length}
            </p>

            <div
              className="pointer-events-none absolute -top-4 -right-8 rotate-12 text-[9rem] leading-none opacity-30 select-none"
              aria-hidden
            >
              {c.emoji}
            </div>

            <div className="relative">
              <h2 className="display text-6xl">{c.label}</h2>
              <p className="mt-3 max-w-[15rem] text-sm font-medium opacity-75">
                {c.blurb}
              </p>
            </div>

            <Link href={`/who-am-i/${c.id}`} className="relative">
              <span className="press pill flex items-center justify-center gap-2 bg-[var(--paper)] px-6 py-3 text-lg font-extrabold text-[var(--ink)]">
                Play {c.label.toLowerCase()} →
              </span>
            </Link>
          </article>
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
            className="press h-2.5 rounded-full border-2 border-[var(--line)] transition-all"
            style={{
              width: i === index ? "1.75rem" : "0.625rem",
              background:
                i === index ? `var(${c.accentVar})` : "var(--paper)",
            }}
          />
        ))}
      </div>

    </section>
  );
}
