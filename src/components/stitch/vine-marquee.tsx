"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  VINE_LENGTH,
  VINE_STITCHES,
  VINE_WIDTH,
  VineTile,
  type PlacedStitch,
} from "@/components/stitch/vine-tile";

/**
 * The flower vine as an endless horizontal strip, ticking along one stitch at
 * a time. Each flower and leaf opens ring by ring as it comes in over the
 * edge and folds back up as it goes out the other side — the bloom follows
 * position, not a clock, so it can never fall out of step with the travel.
 */

const STEP_MS = 220;

const ROOTS = new Map<string, number[]>();
for (const s of VINE_STITCHES) {
  if (s.part === "stem" || s.ring !== 0) continue;
  ROOTS.set(organVar(s), [...(ROOTS.get(organVar(s)) ?? []), s.y]);
}
const ORGANS = [...ROOTS].map(([name, ys]) => ({
  name,
  anchor: ys.reduce((sum, y) => sum + y, 0) / ys.length,
}));

function organVar(s: PlacedStitch) {
  return `--vine-${s.half}-${s.organ}`;
}

function stitchStyle(s: PlacedStitch): CSSProperties | undefined {
  if (s.part === "stem") return undefined;
  const open = `(var(${organVar(s)}) - ${s.ring})`;
  return {
    opacity: `clamp(0, ${open}, 1)`,
    transform: `scale(clamp(0.5, ${open} * 0.5, 1))`,
  };
}

export function VineMarquee({
  direction = "left",
  className,
}: {
  /** Which way the strip travels. */
  direction?: "left" | "right";
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const offset = useRef(0);
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cell = 0;
    let span = 0;

    const paint = () => {
      const x =
        direction === "left" ? -offset.current : offset.current - VINE_LENGTH;
      track.style.transform = `translateX(${x * cell}px)`;
      copyRefs.current.forEach((copy, i) => {
        if (!copy) return;
        for (const { name, anchor } of ORGANS) {
          const at = x + i * VINE_LENGTH + anchor + 0.5;
          copy.style.setProperty(
            name,
            String(Math.floor(Math.min(at, span - at))),
          );
        }
      });
    };

    const measure = () => {
      const { width, height } = root.getBoundingClientRect();
      cell = height / VINE_WIDTH;
      span = cell ? width / cell : 0;
      setCopies(Math.ceil(span / VINE_LENGTH) + 1);
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);

    const timer = window.setInterval(() => {
      offset.current = (offset.current + 1) % VINE_LENGTH;
      paint();
    }, STEP_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [direction]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn("relative h-full w-full overflow-hidden", className)}
    >
      <div ref={trackRef} className="absolute inset-y-0 left-0 flex w-max">
        {Array.from({ length: copies }, (_, i) => (
          <VineTile
            key={i}
            ref={(el) => {
              copyRefs.current[i] = el;
            }}
            className="shrink-0"
            stitchStyle={stitchStyle}
          />
        ))}
      </div>
    </div>
  );
}
