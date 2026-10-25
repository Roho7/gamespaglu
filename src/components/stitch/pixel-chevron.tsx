import { cn } from "@/lib/utils";

const CHEVRON = ["##.....##", ".##...##.", "..##.##..", "...###...", "....#...."];

const TURN = { down: "", up: "rotate-180", left: "rotate-90", right: "-rotate-90" } as const;

export type ChevronDirection = keyof typeof TURN;

function Pixels() {
  return (
    <svg
      viewBox={`0 0 ${CHEVRON[0].length} ${CHEVRON.length}`}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
      className="block w-full"
      fill="currentColor"
    >
      {CHEVRON.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null,
        ),
      )}
    </svg>
  );
}

/**
 * A chevron stitched on the same pixel grid as the frame corners, doubled into a trail that pulses
 * the way it points, so it reads as "swipe this way" rather than as a button.
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
        "flex w-7 flex-col items-center gap-1 [filter:drop-shadow(2px_2px_0_var(--shadow-ink))]",
        TURN[direction],
        className,
      )}
    >
      <span className="animate-nudge w-full">
        <Pixels />
      </span>
      <span className="animate-nudge w-full [animation-delay:180ms]">
        <Pixels />
      </span>
    </span>
  );
}
