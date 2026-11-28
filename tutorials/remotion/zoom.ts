import { Easing, interpolate } from "remotion";

import type { Box } from "../pipeline/schema";

export type ZoomWindow = { box: Box; scale: number; inFrame: number; outFrame: number };

export type Framing = { scale: number; x: number; y: number };

const EASE_FRAMES = 14;
const LEAD_FRAMES = 4;
const MIN_SCALE = 1.2;
const MAX_SCALE = 2.2;

const IDENTITY: Framing = { scale: 1, x: 0, y: 0 };

/** How far to zoom so the box fills most of the frame without cropping it. */
export const scaleFor = (box: Box) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(0.78 / box.w, 0.5 / box.h)));

/** First frame of a zoom that starts on a word, a little early so it lands as the word is said. */
export const zoomStart = (wordStartSec: number, fps: number) => Math.max(0, Math.round(wordStartSec * fps) - LEAD_FRAMES);

/** Last frame of a zoom that ends on a word, after it has eased back out. */
export const zoomEnd = (wordEndSec: number, fps: number) => Math.round(wordEndSec * fps) + EASE_FRAMES;

/** Scale and offset (fractions of the frame) that put the box near the centre at full zoom, never showing past the footage edge. */
export function frame(box: Box, scale: number, amount: number): Framing {
  const s = 1 + (scale - 1) * amount;
  const place = (start: number, size: number) => {
    const centre = start + size / 2;
    const target = centre + (0.5 - centre) * amount;
    return Math.min(0, Math.max(1 - s, target - s * centre));
  };
  return { scale: s, x: place(box.x, box.w), y: place(box.y, box.h) };
}

/** The eased framing at `at`, easing in at a window's start and back out at its end. */
export function framingAt(windows: ZoomWindow[], at: number): Framing {
  const win = windows.find((w) => at >= w.inFrame && at <= w.outFrame);
  if (!win || win.outFrame - win.inFrame < 4) return IDENTITY;
  const ease = Math.min(EASE_FRAMES, (win.outFrame - win.inFrame - 1) / 2);
  const amount = interpolate(
    at,
    [win.inFrame, win.inFrame + ease, win.outFrame - ease, win.outFrame],
    [0, 1, 1, 0],
    { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return frame(win.box, win.scale, amount);
}

/** Where the box sits on screen at full zoom, as top and bottom fractions of the frame. */
export function zoomedSpan(win: ZoomWindow) {
  const f = frame(win.box, win.scale, 1);
  return { top: f.y + f.scale * win.box.y, bottom: f.y + f.scale * (win.box.y + win.box.h) };
}
