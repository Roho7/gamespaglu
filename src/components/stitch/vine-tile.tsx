import type { CSSProperties, Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * The cross-stitch flower vine. A repeat is two halves, the second the mirror
 * of the first: a flower beside the stem, then the stem crossing over with a
 * leaf on each side. The last stitch meets the first of the next copy.
 */

export const FLOWER = [
  ".##.##.",
  "###.###",
  "##.#.##",
  "..#.#..",
  "##.#.##",
  "###.###",
  ".##.##.",
];

const CROSSING = [
  ".s.......",
  "..s...l.l",
  "...s..ll.",
  "lll.s.Lll",
  ".lL..s...",
  "l.l...s..",
  ".......s.",
];

/**
 * `ring` counts outward from where an organ grows: the flower's centre or a
 * leaf's root. `organ` is 0 for the flower, then one per leaf.
 */
type Stitch = {
  part: "stem" | "flower" | "leaf";
  ring: number;
  organ: number;
};
type Row = (Stitch | null)[];

const FLOWER_CENTRE = (FLOWER.length - 1) / 2;

const flowerStitch = (ring: number): Stitch => ({
  part: "flower",
  ring,
  organ: 0,
});

const flowerRows: Row[] = FLOWER.map((row, y) =>
  [...row].map((cell, x) =>
    cell === "#"
      ? flowerStitch(
          Math.round(Math.hypot(x - FLOWER_CENTRE, y - FLOWER_CENTRE)) - 1,
        )
      : null,
  ),
);

const LEAF_ROOTS = CROSSING.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (cell === "L" ? [{ x, y }] : [])),
);

function leafStitch(x: number, y: number): Stitch {
  const reach = LEAF_ROOTS.map((r) =>
    Math.max(Math.abs(x - r.x), Math.abs(y - r.y)),
  );
  const ring = Math.min(...reach);
  return { part: "leaf", ring, organ: reach.indexOf(ring) + 1 };
}

const STEM: Stitch = { part: "stem", ring: 0, organ: -1 };

const crossingRows: Row[] = CROSSING.map((row, y) =>
  [...row].map((cell, x) => {
    if (cell === "s") return STEM;
    if (cell === "l" || cell === "L") return leafStitch(x, y);
    return null;
  }),
);

const HALF: Row[] = [
  ...flowerRows.map((row) => [STEM, null, ...row]),
  ...crossingRows,
];
const REPEAT: Row[] = [...HALF, ...HALF.map((row) => [...row].reverse())];

const COLS = REPEAT[0].length;
const ROWS = REPEAT.length;

/** `half` 0 is the flower beside the stem's start, 1 its mirror. */
export type PlacedStitch = Stitch & { x: number; y: number; half: 0 | 1 };

const STITCHES: PlacedStitch[] = REPEAT.flatMap((row, y) =>
  row.flatMap((stitch, x) =>
    stitch ? [{ x, y, half: y < HALF.length ? 0 : 1, ...stitch } as const] : [],
  ),
);

/** Stitches along one repeat, in the direction copies chain. */
export const VINE_LENGTH = ROWS;

/** Stitches across one repeat. */
export const VINE_WIDTH = COLS;

export const VINE_STITCHES = STITCHES;

/** One repeat of the vine, laid horizontally so copies chain left to right. */
export function VineTile({
  ref,
  stitchStyle,
  className,
}: {
  ref?: Ref<HTMLDivElement>;
  stitchStyle?: (stitch: PlacedStitch) => CSSProperties | undefined;
  className?: string;
}) {
  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("grid h-full", className)}
      style={{
        gridTemplateColumns: `repeat(${ROWS}, 1fr)`,
        gridTemplateRows: `repeat(${COLS}, 1fr)`,
        aspectRatio: `${ROWS} / ${COLS}`,
      }}
    >
      {STITCHES.map((stitch) => (
        <span
          key={`${stitch.x}-${stitch.y}`}
          className="bg-current"
          style={{
            gridColumn: stitch.y + 1,
            gridRow: stitch.x + 1,
            ...stitchStyle?.(stitch),
          }}
        />
      ))}
    </div>
  );
}
