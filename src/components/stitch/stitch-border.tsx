import type { CSSProperties } from "react";
import { FLOWER } from "@/components/stitch/vine-tile";
import { cn } from "@/lib/utils";

/**
 * A cross-stitch frame for any positioned box: a flower stitched into each
 * corner, joined by straight rules that stop one stitch short of each flower.
 * Drawn in currentColor, so it follows the ink and hover states of whatever it
 * sits in.
 */

function mask(p: readonly string[]) {
  const rects = p.flatMap((row, y) =>
    [...row].flatMap((cell, x) =>
      cell === "#" ? [`<rect x="${x}" y="${y}" width="1" height="1"/>`] : [],
    ),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${p[0].length} ${p.length}" shape-rendering="crispEdges">${rects.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const FLOWER_MASK = mask(FLOWER);
const FLOWER_SIZE = `calc(var(--stitch) * ${FLOWER.length})`;

const flowerStyle: CSSProperties = {
  backgroundColor: "currentColor",
  maskImage: FLOWER_MASK,
  WebkitMaskImage: FLOWER_MASK,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  width: FLOWER_SIZE,
  height: FLOWER_SIZE,
};

const STITCH = "var(--stitch)";
const CLEAR = `calc(var(--stitch) * ${FLOWER.length + 1})`;

const CORNERS: CSSProperties[] = [
  { top: 0, left: 0 },
  { top: 0, right: 0 },
  { bottom: 0, left: 0 },
  { bottom: 0, right: 0 },
];

const RULES: CSSProperties[] = [
  { top: 0, left: CLEAR, right: CLEAR, height: STITCH },
  { bottom: 0, left: CLEAR, right: CLEAR, height: STITCH },
  { left: 0, top: CLEAR, bottom: CLEAR, width: STITCH },
  { right: 0, top: CLEAR, bottom: CLEAR, width: STITCH },
];

export function StitchBorder({
  stitch = 3,
  className,
}: {
  /** Size of one stitch in pixels. */
  stitch?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{ ["--stitch" as string]: `${stitch}px` }}
    >
      {RULES.map((at, i) => (
        <span key={i} className="absolute bg-current" style={at} />
      ))}
      {CORNERS.map((at, i) => (
        <span key={i} className="absolute" style={{ ...flowerStyle, ...at }} />
      ))}
    </div>
  );
}
