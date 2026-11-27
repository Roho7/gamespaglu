import { staticFile } from "remotion";
import type { z } from "zod";

import { AudioManifest, Dialogue, type Line, Markers } from "../pipeline/schema";
import { FPS, GAP_SEC } from "./theme";

export type TimedLine = {
  line: Line;
  startFrame: number;
  frames: number;
  audioFile: string | null;
  footageStartFrame: number;
  footageFrames: number | null;
};

export type TutorialData = {
  dialogue: Dialogue;
  footageFile: string;
  lines: TimedLine[];
  totalFrames: number;
};

async function load<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const res = await fetch(staticFile(path));
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return schema.parse(await res.json());
}

export async function loadTutorial(): Promise<TutorialData> {
  const [dialogue, manifest, markers] = await Promise.all([
    load("dialogue.json", Dialogue),
    load("audio/manifest.json", AudioManifest),
    load("capture/markers.json", Markers),
  ]);
  const times = Object.values(markers.shots).sort((a, b) => a - b);
  const clipById = new Map(manifest.lines.map((l) => [l.id, l]));

  let cursor = 0;
  const lines = dialogue.lines.map((line): TimedLine => {
    const clip = clipById.get(line.id);
    if (!clip) throw new Error(`audio manifest has no entry for ${line.id}`);
    const frames = Math.ceil((clip.durationSec + GAP_SEC) * FPS);
    let footageStartFrame = 0;
    let footageFrames: number | null = null;
    if (line.scene.kind === "footage") {
      const start = markers.shots[line.scene.shot];
      if (start === undefined) throw new Error(`no marker for shot "${line.scene.shot}" (${line.id})`);
      const next = times.find((t) => t > start);
      footageStartFrame = Math.round(start * FPS);
      footageFrames = next === undefined ? null : Math.max(1, Math.round(next * FPS) - footageStartFrame - 2);
    }
    const timed = { line, startFrame: cursor, frames, audioFile: clip.file, footageStartFrame, footageFrames };
    cursor += frames;
    return timed;
  });
  return { dialogue, footageFile: markers.file, lines, totalFrames: cursor };
}
