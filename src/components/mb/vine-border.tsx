import type { CSSProperties, Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * One repeat of the cross-stitch flower vine. Stack it to get a border of any
 * length — the last stitch meets the first stitch of the next copy.
 *
 * A repeat is two halves, the second the mirror of the first: a flower on one
 * side of the stem, then the stem crossing over with a leaf on each side.
 * Fill comes from currentColor, so it takes the colourway it sits on.
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
 * `step` orders the whole half-repeat: flower rings, then leaf rings. `ring`
 * is the same count within one organ — a flower or a single leaf — so each
 * organ can open on its own. `organ` is 0 for the flower, then one per leaf.
 */
type Stitch = {
  part: "stem" | "flower" | "leaf";
  step: number;
  ring: number;
  organ: number;
};
type Row = (Stitch | null)[];

const FLOWER_CENTRE = (FLOWER.length - 1) / 2;

const flowerStitch = (ring: number): Stitch => ({
  part: "flower",
  step: ring,
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

const FLOWER_STEPS =
  Math.max(...flowerRows.flat().map((s) => s?.step ?? 0)) + 1;

const LEAF_ROOTS = CROSSING.flatMap((row, y) =>
  [...row].flatMap((cell, x) => (cell === "L" ? [{ x, y }] : [])),
);

function leafStitch(x: number, y: number): Stitch {
  const reach = LEAF_ROOTS.map((r) =>
    Math.max(Math.abs(x - r.x), Math.abs(y - r.y)),
  );
  const ring = Math.min(...reach);
  return {
    part: "leaf",
    step: FLOWER_STEPS + ring,
    ring,
    organ: reach.indexOf(ring) + 1,
  };
}

const STEM: Stitch = { part: "stem", step: 0, ring: 0, organ: -1 };

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

/**
 * One repeat of the grid. Vertical copies stack top to bottom; horizontal
 * copies chain left to right. Horizontal is the same grid with rows and
 * columns swapped, so the join between copies is identical.
 */
export function VineRepeat({
  ref,
  horizontal,
  stitchClassName,
  stitchStyle,
  className,
}: {
  ref?: Ref<HTMLDivElement>;
  horizontal: boolean;
  stitchClassName?: (stitch: PlacedStitch) => string | false | undefined;
  stitchStyle?: (stitch: PlacedStitch) => CSSProperties | undefined;
  className?: string;
}) {
  const cols = horizontal ? ROWS : COLS;
  const rows = horizontal ? COLS : ROWS;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("grid", horizontal ? "h-full" : "w-full", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        aspectRatio: `${cols} / ${rows}`,
      }}
    >
      {STITCHES.map((stitch) => (
        <span
          key={`${stitch.x}-${stitch.y}`}
          className={cn("bg-current", stitchClassName?.(stitch))}
          style={{
            gridColumn: (horizontal ? stitch.y : stitch.x) + 1,
            gridRow: (horizontal ? stitch.x : stitch.y) + 1,
            ["--step" as string]: stitch.step,
            ...stitchStyle?.(stitch),
          }}
        />
      ))}
    </div>
  );
}

/** `bloom` plays the flowers and leaves in on mount; the stem is already there. */
export function VineBorder({
  orientation = "vertical",
  bloom = false,
  className,
}: {
  orientation?: "vertical" | "horizontal";
  bloom?: boolean;
  className?: string;
}) {
  return (
    <VineRepeat
      horizontal={orientation === "horizontal"}
      className={className}
      stitchClassName={(s) => bloom && s.part !== "stem" && "animate-stitch"}
    />
  );
}
