"use client";

import { useRef } from "react";
import { BANDS, clampDial } from "@/lib/wavelength/engine";

const PIVOT_X = 100;
const PIVOT_Y = 100;
const OUTER = 92;
const INNER = 26;

function polar(value: number, radius: number) {
  const theta = Math.PI * (1 - value / 100);
  return [PIVOT_X + radius * Math.cos(theta), PIVOT_Y - radius * Math.sin(theta)];
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

const FILL: Record<number, string> = {
  4: "var(--cw-base)",
  3: "var(--cw-highlight)",
  2: "var(--cw-secondary)",
};

type Slice = { points: number; from: number; to: number };

const WEDGE: Slice[] = BANDS.flatMap((band, i): Slice[] => {
  if (i === 0) return [{ points: band.points, from: -band.reach, to: band.reach }];
  const inner = BANDS[i - 1].reach;
  return [
    { points: band.points, from: -band.reach, to: -inner },
    { points: band.points, from: inner, to: band.reach },
  ];
});

/**
 * The half-circle dial. The target wedge renders only when `target` is given;
 * a hidden target draws nothing at all, so the covered face is identical for
 * every card and no position can leak through it.
 */
export function WavelengthDial({
  dial,
  target,
  onMove,
  label,
}: {
  dial: number | null;
  target: number | null;
  onMove?: (value: number) => void;
  label: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

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
    if (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const v = valueAt(e.clientX, e.clientY);
    if (v !== null) onMove(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (!onMove || dial === null) return;
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") onMove(clampDial(dial - step));
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") onMove(clampDial(dial + step));
    else return;
    e.preventDefault();
  };

  const [needleX, needleY] = polar(dial ?? 50, OUTER - 4);
  const interactive = Boolean(onMove);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 106"
      className={`w-full touch-none select-none outline-none focus-visible:outline-2 focus-visible:outline-[var(--cw-shadow)] ${interactive ? "cursor-grab" : ""}`}
      role={interactive ? "slider" : "img"}
      aria-label={label}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? 100 : undefined}
      aria-valuenow={interactive && dial !== null ? dial : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={(e) => {
        if (!onMove) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag(e);
      }}
      onPointerMove={drag}
      onKeyDown={onKeyDown}
    >
      <path d={sector(0, 100)} fill="var(--cw-shadow)" />
      {[0, 25, 50, 75, 100].map((v) => {
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
        <g className="animate-wedge">
          {WEDGE.map((b) => (
            <path
              key={`${b.points}:${b.from}`}
              d={sector(target + b.from, target + b.to)}
              fill={FILL[b.points]}
            />
          ))}
          {WEDGE.map((b) => {
            const [x, y] = polar(target + (b.from + b.to) / 2, OUTER - 14);
            return (
              <text
                key={`n${b.points}:${b.from}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={8}
                fontWeight={800}
                fill="var(--cw-shadow)"
              >
                {b.points}
              </text>
            );
          })}
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
      <circle cx={PIVOT_X} cy={PIVOT_Y} r={INNER - 4} fill="var(--cw-primary)" />
      <circle cx={PIVOT_X} cy={PIVOT_Y} r={9} fill="var(--cw-highlight)" stroke="var(--cw-shadow)" strokeWidth={2.5} />
    </svg>
  );
}
