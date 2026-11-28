import type { Line } from "./schema";

export const TIGHT_GAP_SEC = 0.1;
export const BEAT_GAP_SEC = 0.65;

const subjectOf = (line: Line) => line.subject ?? line.section;

/** Silence after a line: tight when the next line stays on its subject, a beat when the subject changes or the video ends. */
export function gapAfter(lines: Line[], index: number): number {
  const next = lines[index + 1];
  return next && subjectOf(next) === subjectOf(lines[index]) ? TIGHT_GAP_SEC : BEAT_GAP_SEC;
}

/** Start frame and length of every line, given each clip's spoken length. */
export function lineTimes(lines: Line[], durationSec: (line: Line) => number, fps: number) {
  let cursor = 0;
  return lines.map((line, i) => {
    const frames = Math.ceil((durationSec(line) + gapAfter(lines, i)) * fps);
    const timed = { startFrame: cursor, frames };
    cursor += frames;
    return timed;
  });
}
