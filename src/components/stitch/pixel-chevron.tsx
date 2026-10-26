import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const CHEVRON = [
  "##.....##",
  ".##...##.",
  "..##.##..",
  "...###...",
  "....#....",
];

const TRAIL = 2;

const STITCHES = Array.from({ length: TRAIL }, (_, n) =>
  CHEVRON.flatMap((row, y) =>
    [...row].flatMap((cell, x) =>
      cell === "#"
        ? [{ x, y: y + n * (CHEVRON.length + 1), rank: y + n * CHEVRON.length }]
        : [],
    ),
  ),
).flat();

const TURN = {
  down: "",
  up: "rotate-180",
  left: "rotate-90",
  right: "-rotate-90",
} as const;

export type ChevronDirection = keyof typeof TURN;

/**
 * A chevron stitched on the same pixel grid as the frame corners, doubled into a trail. It sews
 * itself in a row at a time toward the point and unpicks the same way, like the vine marquee's
 * blooms, so it reads as "swipe this way" rather than as a button.
 */
export function PixelChevron({
  direction,
  className,
}: {
  direction: ChevronDirection;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "block w-7 [filter:drop-shadow(2px_2px_0_var(--shadow-ink))]",
        TURN[direction],
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${CHEVRON[0].length} ${TRAIL * (CHEVRON.length + 1) - 1}`}
        shapeRendering="crispEdges"
        focusable="false"
        className="block w-full"
        fill="currentColor"
      >
        {STITCHES.map(({ x, y, rank }) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            className="mb-sew"
            style={{ "--rank": rank } as CSSProperties}
          />
        ))}
      </svg>
    </span>
  );
}
