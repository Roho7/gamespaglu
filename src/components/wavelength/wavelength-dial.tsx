"use client";

import { useRef } from "react";
import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { type Palette, theme } from "@/lib/palettes";
import { BANDS, clampDial } from "@/lib/wavelength/engine";

const PIVOT_X = 100;
const PIVOT_Y = 100;
const OUTER = 92;
const INNER = 26;

function polar(value: number, radius: number) {
  const theta = Math.PI * (1 - value / 100);
  const round = (n: number) => Math.round(n * 100) / 100;
  return [
    round(PIVOT_X + radius * Math.cos(theta)),
    round(PIVOT_Y - radius * Math.sin(theta)),
  ];
}

function sector(from: number, to: number) {
  const a = clampDial(from);
  const b = clampDial(to);
  const [x1, y1] = polar(a, OUTER);
  const [x2, y2] = polar(b, OUTER);
  const [x3, y3] = polar(b, INNER);
  const [x4, y4] = polar(a, INNER);
  return `M${x1} ${y1} A${OUTER} ${OUTER} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${INNER} ${INNER} 0 0 0 ${x4} ${y4}Z`;
}

const FILL = [
  "var(--cw-secondary)",
  "var(--cw-highlight)",
  "var(--cw-primary)",
];
const CASCADE_DELAY = 0.14;
const FACE_MASK = `radial-gradient(circle at 50% 100%, transparent ${INNER / 2}cqw, black ${INNER / 2}cqw, black ${OUTER / 2}cqw, transparent ${OUTER / 2}cqw)`;

type Slice = { tier: number; from: number; to: number; growsFrom: number };

const WEDGE: Slice[] = BANDS.flatMap((band, tier): Slice[] => {
  if (tier === 0)
    return [{ tier, from: -band.reach, to: band.reach, growsFrom: 0 }];
  const inner = BANDS[tier - 1].reach;
  return [
    { tier, from: -band.reach, to: -inner, growsFrom: -inner },
    { tier, from: inner, to: band.reach, growsFrom: inner },
  ];
});

/**
 * The half-circle dial. The target wedge renders only when `target` is given;
 * a hidden target draws nothing at all, so the covered face is identical for
 * every card and no position can leak through it.
 *
 * With `onHold` the whole face is a press-and-hold button: down reveals, up
 * hides. That is the Psychic's peek, so there is no separate control for it.
 */
export function WavelengthDial({
  dial,
  target,
  onMove,
  onHold,
  label,
  palette,
}: {
  dial: number | null;
  target: number | null;
  onMove?: (value: number) => void;
  onHold?: (held: boolean) => void;
  label: string;
  palette: Palette;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const reduceMotion = useReducedMotion();

  const valueAt = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const dy = Math.max(0, PIVOT_Y - p.y);
    const theta = Math.atan2(dy, p.x - PIVOT_X);
    return clampDial(100 * (1 - theta / Math.PI));
  };

  const drag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onMove) return;
    if (
      e.type === "pointermove" &&
      !e.currentTarget.hasPointerCapture(e.pointerId)
    )
      return;
    const v = valueAt(e.clientX, e.clientY);
    if (v !== null) onMove(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (onHold && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      if (!e.repeat) onHold(true);
      return;
    }
    if (!onMove || dial === null) return;
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown")
      onMove(clampDial(dial - step));
    else if (e.key === "ArrowRight" || e.key === "ArrowUp")
      onMove(clampDial(dial + step));
    else return;
    e.preventDefault();
  };

  const [needleX, needleY] = polar(dial ?? 50, OUTER - 4);
  const interactive = Boolean(onMove);
  const release = () => onHold?.(false);

  return (
    <div {...theme(palette)} className="relative [container-type:inline-size]">
      <div
        className="absolute inset-0"
        style={{ mask: FACE_MASK, WebkitMask: FACE_MASK }}
      >
        <PaletteGrain palette={palette} tone="field" />
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 200 100"
        className={`relative w-full touch-none select-none outline-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-[var(--cw-shadow)] ${interactive ? "cursor-grab" : onHold ? "cursor-pointer" : ""}`}
        role={interactive ? "slider" : onHold ? "button" : "img"}
        aria-label={
          onHold ? `${label}. Press and hold to see the target` : label
        }
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? 100 : undefined}
        aria-valuenow={interactive && dial !== null ? dial : undefined}
        tabIndex={interactive || onHold ? 0 : undefined}
        onPointerDown={(e) => {
          if (!onMove && !onHold) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          onHold?.(true);
          drag(e);
        }}
        onPointerMove={drag}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") release();
        }}
        onBlur={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        {[25, 50, 75].map((v) => {
          const [x1, y1] = polar(v, OUTER - 3);
          const [x2, y2] = polar(v, OUTER - 9);
          return (
            <line
              key={v}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--cw-primary)"
              strokeWidth={1.5}
            />
          );
        })}

        {target !== null ? (
          <g>
            {WEDGE.map((b) => (
              <motion.path
                key={`${b.tier}:${b.from}`}
                fill={FILL[b.tier]}

                strokeWidth={1}
                initial={
                  reduceMotion
                    ? false
                    : { d: sector(target + b.growsFrom, target + b.growsFrom) }
                }
                animate={{ d: sector(target + b.from, target + b.to) }}
                transition={{
                  type: "spring",
                  duration: 0.45,
                  bounce: b.tier === 0 ? 0.55 : 0.2,
                  delay: b.tier * CASCADE_DELAY,
                }}
              />
            ))}
          </g>
        ) : null}

        {onHold && target === null ? (
          <g pointerEvents="none">
            <g className="animate-bob">
              <ArrowDown
                x={PIVOT_X - 11}
                y={24}
                width={22}
                height={22}
                color="var(--cw-shadow)"
                strokeWidth={3}
              />
            </g>
            <text
              x={PIVOT_X}
              y={60}
              textAnchor="middle"
              className="mb-caps"
              fontSize={7.5}
              fill="var(--cw-shadow)"
            >
              Press and hold
            </text>
          </g>
        ) : null}

        {dial !== null ? (
          <g>
            <line
              x1={PIVOT_X}
              y1={PIVOT_Y}
              x2={needleX}
              y2={needleY}
              stroke="var(--cw-shadow)"
              strokeWidth={7}
              strokeLinecap="round"
            />
            <line
              x1={PIVOT_X}
              y1={PIVOT_Y}
              x2={needleX}
              y2={needleY}
              stroke="var(--cw-highlight)"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </g>
        ) : null}
        <circle
          cx={PIVOT_X}
          cy={PIVOT_Y}
          r={INNER - 4}
          fill="var(--cw-primary)"
        />
        <circle
          cx={PIVOT_X}
          cy={PIVOT_Y}
          r={9}
          fill="var(--cw-highlight)"
          stroke="var(--cw-shadow)"
          strokeWidth={2.5}
        />
      </svg>
    </div>
  );
}
