import { z } from "zod";

import { ICON_NAMES } from "../remotion/icons";

const Icon = z.enum(ICON_NAMES);

const Stat = z.object({ icon: Icon, value: z.string(), label: z.string() });

export const Graphic = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stat"), ...Stat.shape }),
  z.object({ type: z.literal("list"), items: z.array(Stat).min(1) }),
]);

const Cue = z.object({ word: z.number().int().nonnegative(), shot: z.string().min(1) });

export const Scene = z.object({
  shot: z.string().min(1),
  cues: z.array(Cue).optional(),
  callout: z.string().optional(),
  graphic: Graphic.optional(),
});

export const scriptWords = (text: string) => text.split(/\s+/).filter(Boolean);

export const SECTIONS = ["intro", "setup", "gameplay", "rounds", "winning"] as const;

export const Line = z.object({
  id: z.string().min(1),
  section: z.enum(SECTIONS),
  text: z.string().min(1),
  scene: Scene,
  estimateSec: z.number().positive(),
}).superRefine((line, ctx) => {
  const count = scriptWords(line.text).length;
  let previous = -1;
  for (const [i, cue] of (line.scene.cues ?? []).entries()) {
    if (cue.word >= count || cue.word <= previous) {
      ctx.addIssue({
        code: "custom",
        path: ["scene", "cues", i, "word"],
        message: `cue word ${cue.word} must be in 0..${count - 1} and after the previous cue`,
      });
    }
    previous = cue.word;
  }
});

export const Dialogue = z.object({
  game: z.string(),
  title: z.string(),
  route: z.string(),
  lines: z.array(Line).min(1),
});

export const VoiceConfig = z.object({
  provider: z.literal("higgsfield"),
  model: z.string().nullable(),
  voiceType: z.enum(["preset", "element"]).nullable(),
  voiceId: z.string().nullable(),
  voiceName: z.string().nullable(),
});
export type VoiceConfig = z.infer<typeof VoiceConfig>;

export const Markers = z.object({
  game: z.string(),
  file: z.literal("footage.mp4"),
  fps: z.number().positive().optional(),
  shots: z.record(z.string(), z.number().nonnegative()),
  ends: z.record(z.string(), z.number().nonnegative()).optional(),
});

export const Word = z.object({ text: z.string(), startSec: z.number().nonnegative(), endSec: z.number().nonnegative() });

export const AudioManifest = z.object({
  voice: VoiceConfig,
  source: z.enum(["higgsfield", "placeholder"]),
  timing: z.enum(["whisper", "estimate"]),
  lines: z.array(
    z.object({
      id: z.string(),
      file: z.string().nullable(),
      durationSec: z.number().nonnegative(),
      words: z.array(Word),
    }),
  ),
  totalSec: z.number().nonnegative(),
});

export type Graphic = z.infer<typeof Graphic>;
export type Word = z.infer<typeof Word>;
export type Scene = z.infer<typeof Scene>;
export type Line = z.infer<typeof Line>;
export type Dialogue = z.infer<typeof Dialogue>;
export type Markers = z.infer<typeof Markers>;
export type AudioManifest = z.infer<typeof AudioManifest>;

