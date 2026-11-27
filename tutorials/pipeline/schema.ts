import { z } from "zod";

import { ICON_NAMES } from "../remotion/icons";

const Icon = z.enum(ICON_NAMES);

const Stat = z.object({ icon: Icon, value: z.string(), label: z.string() });

export const Graphic = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stat"), ...Stat.shape }),
  z.object({ type: z.literal("list"), items: z.array(Stat).min(1) }),
]);

export const Scene = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("footage"),
    shot: z.string(),
    callout: z.string().optional(),
  }),
  z.object({ kind: z.literal("infographic"), graphic: Graphic }),
]);

export const SECTIONS = ["intro", "setup", "gameplay", "rounds", "winning"] as const;

export const Line = z.object({
  id: z.string().min(1),
  section: z.enum(SECTIONS),
  text: z.string().min(1),
  scene: Scene,
  estimateSec: z.number().positive(),
});

export const Dialogue = z.object({
  game: z.string(),
  title: z.string(),
  route: z.string(),
  lines: z.array(Line).min(1),
});

export const Markers = z.object({
  game: z.string(),
  file: z.literal("footage.webm"),
  fps: z.number().positive().optional(),
  shots: z.record(z.string(), z.number().nonnegative()),
});

export const AudioManifest = z.object({
  voice: z.object({
    provider: z.literal("higgsfield"),
    model: z.string().nullable(),
    voiceId: z.string().nullable(),
  }),
  source: z.enum(["higgsfield", "placeholder"]),
  lines: z.array(
    z.object({
      id: z.string(),
      file: z.string().nullable(),
      durationSec: z.number().nonnegative(),
    }),
  ),
  totalSec: z.number().nonnegative(),
});

export type Graphic = z.infer<typeof Graphic>;
export type Scene = z.infer<typeof Scene>;
export type Line = z.infer<typeof Line>;
export type Dialogue = z.infer<typeof Dialogue>;
export type Markers = z.infer<typeof Markers>;
export type AudioManifest = z.infer<typeof AudioManifest>;

export const VoiceConfig = z.object({
  provider: z.literal("higgsfield"),
  model: z.string().nullable(),
  voiceId: z.string().nullable(),
});
export type VoiceConfig = z.infer<typeof VoiceConfig>;
