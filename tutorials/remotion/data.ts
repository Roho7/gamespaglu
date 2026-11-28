import { staticFile } from "remotion";
import type { z } from "zod";

import { AudioManifest, Dialogue, type Line, Markers, type Palette, scriptWords, type Word } from "../pipeline/schema";
import { lineTimes } from "../pipeline/timing";
import { FPS, MIAMI } from "./theme";
import { scaleFor, zoomedSpan, zoomEnd, zoomStart,type ZoomWindow } from "./zoom";

export type Segment = {
  shot: string;
  startFrame: number;
  frames: number;
  footageStartFrame: number;
  footageFrames: number;
};

export type CaptionPlace = "top" | "bottom";

export type TimedLine = {
  line: Line;
  startFrame: number;
  frames: number;
  audioFile: string | null;
  words: Word[];
  segments: Segment[];
  zooms: ZoomWindow[];
  captionAt: CaptionPlace;
};

export type TutorialData = {
  dialogue: Dialogue;
  palette: Palette;
  footageFile: string;
  lines: TimedLine[];
  totalFrames: number;
};

const CAPTION_SPANS: Record<CaptionPlace, { top: number; bottom: number }> = {
  bottom: { top: 0.72, bottom: 0.8 },
  top: { top: 0.04, bottom: 0.1 },
};

async function load<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const res = await fetch(staticFile(path));
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return schema.parse(await res.json());
}

function captionPlace(zooms: ZoomWindow[], hasCallout: boolean): CaptionPlace {
  if (hasCallout) return "top";
  const spans = zooms.map(zoomedSpan);
  const clear = (place: CaptionPlace) =>
    spans.every((s) => s.bottom < CAPTION_SPANS[place].top || s.top > CAPTION_SPANS[place].bottom);
  return clear("bottom") || !clear("top") ? "bottom" : "top";
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

  const clips = dialogue.lines.map((line) => {
    const clip = clipById.get(line.id);
    if (!clip) throw new Error(`audio manifest has no entry for ${line.id}`);
    if (clip.words.length !== scriptWords(line.text).length) {
      throw new Error(`audio manifest words for ${line.id} are stale, rerun voice`);
    }
    return clip;
  });
  const placed = lineTimes(dialogue.lines, (line) => clipById.get(line.id)!.durationSec, FPS);

  const lines = dialogue.lines.map((line, i): TimedLine => {
    const clip = clips[i];
    const { startFrame, frames } = placed[i];
    const cuts = [
      { shot: line.scene.shot, at: 0 },
      ...(line.scene.cues ?? []).map((cue) => ({
        shot: cue.shot,
        at: Math.min(frames - 1, Math.round(clip.words[cue.word].startSec * FPS)),
      })),
    ];
    const segments = cuts.map((cut, j): Segment => ({
      shot: cut.shot,
      startFrame: cut.at,
      frames: (cuts[j + 1]?.at ?? frames) - cut.at,
      ...footageWindow(cut.shot, line.id),
    }));
    const zooms = (line.scene.zooms ?? []).map((zoom): ZoomWindow => {
      const box = markers.focus?.[zoom.focus];
      if (!box) throw new Error(`no focus box "${zoom.focus}" in markers (${line.id})`);
      return {
        box,
        scale: scaleFor(box),
        inFrame: zoom.word === undefined ? 0 : zoomStart(clip.words[zoom.word].startSec, FPS),
        outFrame: zoom.until === undefined ? frames : Math.min(frames, zoomEnd(clip.words[zoom.until].endSec, FPS)),
      };
    });
    return {
      line,
      startFrame,
      frames,
      audioFile: clip.file,
      words: clip.words,
      segments,
      zooms,
      captionAt: captionPlace(zooms, Boolean(line.scene.callout)),
    };
  });
  const last = placed.at(-1)!;
  return {
    dialogue,
    palette: dialogue.palette ?? MIAMI,
    footageFile: markers.file,
    lines,
    totalFrames: last.startFrame + last.frames,
  };
}
