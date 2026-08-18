"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Fills the screen with one label, whether it's "47" or "Rashtrapati Bhavan".
 *
 * Measurement note, learned the hard way: a block element's `scrollWidth` is
 * clamped to its own width, so text spilling past the edge is invisible to it —
 * "Salaar" rendered at 140px and ran off the screen. We measure the real line
 * boxes with a Range instead, which reports the true painted extent including
 * overflow.
 *
 * Wrapping happens at spaces only. Splitting a word across lines is unreadable
 * across a room, which is the one thing this screen exists to do.
 */
export function FitText({
  text,
  className,
  min = 20,
  max = 320,
}: {
  text: string;
  className?: string;
  min?: number;
  max?: number;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span) return;
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (w === 0 || h === 0) return;

    const measure = (size: number) => {
      span.style.fontSize = `${size}px`;
      const range = document.createRange();
      range.selectNodeContents(span);
      const rect = range.getBoundingClientRect();
      range.detach();
      return rect;
    };

    let lo = min;
    let hi = max;
    let best = min;
    for (let i = 0; i < 14 && lo <= hi; i++) {
      const mid = Math.floor((lo + hi) / 2);
      const rect = measure(mid);
      if (rect.width <= w && rect.height <= h) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    span.style.fontSize = `${best}px`;
    box.style.visibility = "visible";
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
      style={{ visibility: "hidden" }}
    >
      <span
        ref={spanRef}
        className={className}
        style={{
          display: "block",
          width: "100%",
          fontSize: min,
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
