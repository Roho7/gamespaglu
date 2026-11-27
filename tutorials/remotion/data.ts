import { staticFile } from "remotion";
import type { z } from "zod";

import { AudioManifest, Dialogue, type Line, Markers, scriptWords, type Word } from "../pipeline/schema";
import { FPS, GAP_SEC } from "./theme";

export type Segment = {
  shot: string;
  startFrame: number;
  frames: number;
  footageStartFrame: number;
  footageFrames: number;
};

export type TimedLine = {
  line: Line;
  startFrame: number;
  frames: number;
  audioFile: string | null;
  words: Word[];
  segments: Segment[];
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

  const footageWindow = (shot: string, lineId: string) => {
    const start = markers.shots[shot];
    if (start === undefined) throw new Error(`no marker for shot "${shot}" (${lineId})`);
    const end = markers.ends?.[shot] ?? times.find((t) => t > start);
    const footageStartFrame = Math.round(start * FPS);
    const footageFrames = end === undefined ? Infinity : Math.max(1, Math.round(end * FPS) - footageStartFrame - 1);
    return { footageStartFrame, footageFrames };
  };

  let cursor = 0;
  const lines = dialogue.lines.map((line): TimedLine => {
    const clip = clipById.get(line.id);
    if (!clip) throw new Error(`audio manifest has no entry for ${line.id}`);
    if (clip.words.length !== scriptWords(line.text).length) {
      throw new Error(`audio manifest words for ${line.id} are stale, rerun voice`);
    }
    const frames = Math.ceil((clip.durationSec + GAP_SEC) * FPS);
    const cuts = [
      { shot: line.scene.shot, at: 0 },
      ...(line.scene.cues ?? []).map((cue) => ({
        shot: cue.shot,
        at: Math.min(frames - 1, Math.round(clip.words[cue.word].startSec * FPS)),
      })),
    ];
    const segments = cuts.map((cut, i): Segment => ({
      shot: cut.shot,
      startFrame: cut.at,
      frames: (cuts[i + 1]?.at ?? frames) - cut.at,
      ...footageWindow(cut.shot, line.id),
    }));
    const timed = { line, startFrame: cursor, frames, audioFile: clip.file, words: clip.words, segments };
    cursor += frames;
    return timed;
  });
  return { dialogue, footageFile: markers.file, lines, totalFrames: cursor };
}
