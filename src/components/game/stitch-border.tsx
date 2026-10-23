import type { CSSProperties } from "react";
import { FLOWER } from "@/components/mb/vine-border";
import { cn } from "@/lib/utils";

/**
 * A cross-stitch frame for any positioned box: a smooth outer rule with a
 * flower stitched into each corner, so the pixel detail shows only on the
 * inside. Drawn in currentColor, so it follows the ink and hover states of
 * whatever it sits in.
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

const EDGE = "calc(var(--stitch) * -1)";

const CORNERS: CSSProperties[] = [
  { top: EDGE, left: EDGE },
  { top: EDGE, right: EDGE },
  { bottom: EDGE, left: EDGE },
  { bottom: EDGE, right: EDGE },
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
      style={{
        ["--stitch" as string]: `${stitch}px`,
        border: "var(--stitch) solid currentColor",
      }}
    >
      {CORNERS.map((at, i) => (
        <span key={i} className="absolute" style={{ ...flowerStyle, ...at }} />
      ))}
    </div>
  );
}
