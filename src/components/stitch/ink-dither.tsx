"use client";

import { Dithering, type DitheringProps } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const CLEAR = "rgba(0, 0, 0, 0)"; // check-tokens-ignore

function tint(ink: string, alpha: number) {
  return alpha > 0
    ? ink.replace(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+).*$/,
      `rgba($1, $2, $3, ${alpha})`,
    )
    : CLEAR;
}

const INK_CHANGES = [
  "pointerenter",
  "pointerleave",
  "pointerdown",
  "pointerup",
  "pointercancel",
  "focusin",
  "focusout",
] as const;

/**
 * A moving dither in currentColor over a clear ground, filling its positioned
 * parent. Mask the parent to give it a shape. The ink is re-read whenever the
 * enclosing link or button's hover, press or focus state can change it.
 * `ground` prints the ink faintly under the dither, so a small shape always
 * reads whole. The shader mounts only near the viewport, so a long page never
 * holds more WebGL contexts than the browser allows.
 */
export function InkDither({
  shape = "ripple",
  scale = 10,
  ground = 0.1,
}: {
  shape?: DitheringProps["shape"];
  scale?: number;
  /** Opacity of the ink under the dither, 0 to 1. */
  ground?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState<string>();
  const [near, setNear] = useState(false);
  const still = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.closest("a, button");
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setInk(getComputedStyle(el).color));
    };
    read();
    for (const type of INK_CHANGES) host?.addEventListener(type, read);
    const sight = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      {
        rootMargin: "50%",
      },
    );
    sight.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      for (const type of INK_CHANGES) host?.removeEventListener(type, read);
      sight.disconnect();
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="absolute inset-0">
      {ink && near ? (
        <Dithering
          width="100%"
          height="100%"
          colorBack={tint(ink, ground)}
          colorFront={ink}
          shape={shape}
          type="4x4"
          size={1}
          scale={scale}
          speed={still ? 0 : 0.6}
        />
      ) : null}
    </div>
  );
}
