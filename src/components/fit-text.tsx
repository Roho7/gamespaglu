"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * The reveal must fill the screen whether the answer is "47" or
 * "Rashtrapati Bhavan". Binary-search the largest size that still fits, letting
 * long labels wrap onto extra lines rather than capping at the width of one.
 * Never truncates.
 *
 * Absolutely positioned against a relative parent: percentage heights inside a
 * min-height flex column resolve unreliably, and a mis-measured box means a
 * word that doesn't fill the phone.
 */
export function FitText({
  text,
  className,
  min = 24,
  max = 320,
}: {
  text: string;
  className?: string;
  min?: number;
  max?: number;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [ready, setReady] = useState(false);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span) return;
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (w === 0 || h === 0) return;

    let lo = min;
    let hi = max;
    let best = min;
    for (let i = 0; i < 14 && lo <= hi; i++) {
      const mid = Math.floor((lo + hi) / 2);
      span.style.fontSize = `${mid}px`;
      if (span.scrollWidth <= w + 1 && span.scrollHeight <= h + 1) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    span.style.fontSize = `${best}px`;
    setReady(true);
  }, [min, max]);

  useLayoutEffect(() => {
    fit();
  }, [fit, text]);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    // Webfonts land after first paint and change every measurement.
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div
      ref={boxRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ visibility: ready ? "visible" : "hidden" }}
    >
      <span
        ref={spanRef}
        className={className}
        style={{
          display: "block",
          maxWidth: "100%",
          fontSize: min,
          // Break at spaces only. Splitting a word across lines ("HO / WR / AH
          // / BRI / DGE") is unreadable across a room, which is the one thing
          // this screen exists to do.
          overflowWrap: "normal",
          wordBreak: "normal",
          hyphens: "none",
          textWrap: "balance",
        }}
      >
        {text}
      </span>
    </div>
  );
}
