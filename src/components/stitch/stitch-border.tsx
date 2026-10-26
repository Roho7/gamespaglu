import type { ComponentProps, CSSProperties } from "react";
import { DitheredRules } from "@/components/stitch/dithered-rules";
import { FLOWER } from "@/components/stitch/vine-tile";
import { cn } from "@/lib/utils";

type Pattern = readonly string[];

const ARROW: Pattern = [
  "..#####",
  "...####",
  "....###",
  "...#.##",
  "..#...#",
  ".......",
  ".......",
];

const CROSS: Pattern = [
  "#.....#",
  ".#...#.",
  "..#.#..",
  "...#...",
  "..#.#..",
  ".#...#.",
  "#.....#",
];

const BUD: Pattern = ["..#..", ".#.#.", "#...#", ".#.#.", "..#.."];

/**
 * What each frame stitches into its corners, clockwise from top-left: a card
 * is all flowers, a link card trades the top-right flower for an arrow, and a
 * field (a text box) uses a smaller bud so it never reads as a card.
 */
const VARIANTS = {
  card: { stitch: 3, corners: [FLOWER, FLOWER, FLOWER, FLOWER] },
  link: { stitch: 3, corners: [FLOWER, ARROW, FLOWER, FLOWER] },
  field: { stitch: 2, corners: [BUD, BUD, BUD, BUD] },
} satisfies Record<string, { stitch: number; corners: Pattern[] }>;

export type StitchVariant = keyof typeof VARIANTS;

const CORNERS: CSSProperties[] = [
  { top: 0, left: 0 },
  { top: 0, right: 0 },
  { bottom: 0, right: 0 },
  { bottom: 0, left: 0 },
];

function mask(p: Pattern) {
  const rects = p.flatMap((row, y) =>
    [...row].flatMap((cell, x) =>
      cell === "#" ? [`<rect x="${x}" y="${y}" width="1" height="1"/>`] : [],
    ),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p[0].length} ${p.length}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function stitched(p: Pattern, size: string): CSSProperties {
  const image = mask(p);
  return {
    backgroundColor: "currentColor",
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    width: size,
    height: size,
  };
}

function frame(corners: Pattern[]) {
  const cells = corners[0].length;
  const size = `calc(var(--stitch) * ${cells})`;
  const clear = `calc(var(--stitch) * ${cells + 1})`;
  const stitch = "var(--stitch)";
  return {
    clear,
    cross: stitched(CROSS, size),
    corners: corners.map((p, i): CSSProperties => ({
      ...CORNERS[i],
      ...stitched(p, size),
    })),
    rules: [
      { top: 0, left: clear, right: clear, height: stitch },
      { bottom: 0, left: clear, right: clear, height: stitch },
      { left: 0, top: clear, bottom: clear, width: stitch },
      { right: 0, top: clear, bottom: clear, width: stitch },
    ] satisfies CSSProperties[],
  };
}

const FRAMES = Object.fromEntries(
  Object.entries(VARIANTS).map(([k, v]) => [k, frame(v.corners)]),
) as Record<StitchVariant, ReturnType<typeof frame>>;

/**
 * A cross-stitch frame for any positioned box: a motif stitched into each
 * corner, joined by straight rules that stop one stitch short of it. Drawn in
 * currentColor, so it follows the ink and hover states of whatever it sits in.
 *
 * `closeButton` makes the top-right corner a stitched cross that closes
 * whatever the frame is on; its props (onClick, a dialog's close handlers) go
 * straight onto the button. A link frame's arrow nudges toward its target when
 * the nearest `group` is hovered. `dithered` prints the rules as a moving
 * dither instead of solid lines, for the band actions.
 */
export function StitchBorder({
  variant = "card",
  stitch,
  closeButton,
  dithered,
  className,
}: {
  variant?: StitchVariant;
  stitch?: number;
  closeButton?: ComponentProps<"button">;
  dithered?: boolean;
  className?: string;
}) {
  const { corners, rules, cross, clear } = FRAMES[variant];
  return (
    <div
      className={cn("pointer-events-none absolute", className)}
      style={{
        ["--stitch" as string]: `${stitch ?? VARIANTS[variant].stitch}px`,
      }}
    >
      {dithered ? (
        <DitheredRules clear={clear} />
      ) : (
        rules.map((at, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute bg-current"
            style={at}
          />
        ))
      )}
      {corners.map((at, i) =>
        i === 1 && closeButton ? (
          <button
            key={i}
            type="button"
            aria-label="Close"
            {...closeButton}
            className={cn(
              "pointer-events-auto absolute -top-2.5 -right-2.5 p-2.5 transition-transform duration-200 hover:rotate-90 focus-visible:rotate-90",
              closeButton.className,
            )}
          >
            <span aria-hidden className="block" style={cross} />
          </button>
        ) : (
          <span
            key={i}
            aria-hidden
            className={cn(
              "absolute",
              i === 1 &&
              variant === "link" &&
              "transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1",
            )}
            style={at}
          />
        ),
      )}
    </div>
  );
}
