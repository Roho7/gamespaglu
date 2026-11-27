import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { gameDir, gameFromArgv, readJson, TUTORIALS_DIR } from "./paths";
import { type AudioManifest, Dialogue, VoiceConfig } from "./schema";

const EXTENSIONS = ["wav", "mp3"] as const;
const BLIP_SEC = 0.2;
const LEAD_SEC = 0.05;
const TAIL_SEC = 0.12;

function rawClip(rawDir: string, id: string): string | null {
  const ext = EXTENSIONS.find((e) => existsSync(join(rawDir, `${id}.${e}`)));
  return ext ? join(rawDir, `${id}.${ext}`) : null;
}

function speechBounds(file: string): { start: number; end: number } {
  const total = probeSeconds(file);
  const log = spawnSync(
    "ffmpeg",
    ["-i", file, "-af", "silencedetect=noise=-45dB:d=0.08", "-f", "null", "-"],
    { encoding: "utf8" },
  ).stderr;
  const marks = [...log.matchAll(/silence_(start|end): ([\d.]+)/g)].map((m) => ({
    kind: m[1],
    at: Number.parseFloat(m[2]),
  }));
  const spans: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.kind === "start") spans.push({ start: cursor, end: mark.at });
    else cursor = mark.at;
  }
  if (marks.at(-1)?.kind !== "start") spans.push({ start: cursor, end: total });
  const speech = spans.filter((s) => s.end - s.start >= BLIP_SEC);
  if (speech.length === 0) throw new Error(`no speech found in ${file}`);
  return {
    start: Math.max(0, speech[0].start - LEAD_SEC),
    end: Math.min(total, speech.at(-1)!.end + TAIL_SEC),
  };
}

function trimTo(source: string, target: string) {
  const { start, end } = speechBounds(source);
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", source,
    "-af", `atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS`,
    target,
  ]);
}

function probeSeconds(file: string): number {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number.parseFloat(out.trim());
}

function main() {
  const game = gameFromArgv();
  const audioDir = join(gameDir(game), "audio");
  const rawDir = join(audioDir, "raw");
  mkdirSync(rawDir, { recursive: true });

  const dialogue = readJson(join(gameDir(game), "dialogue.json"), Dialogue);
  const voice = readJson(join(TUTORIALS_DIR, "voice.config.json"), VoiceConfig);

  const clips = dialogue.lines.map((line) => ({ line, raw: rawClip(rawDir, line.id) }));
  const have = clips.filter((c) => c.raw);
  if (have.length > 0 && have.length < clips.length) {
    const missing = clips.filter((c) => !c.raw).map((c) => c.line.id);
    throw new Error(`partial clips in tutorials/${game}/audio/raw, missing: ${missing.join(", ")}`);
  }

  const lines = clips.map(({ line, raw }) => {
    if (!raw) return { id: line.id, file: null, durationSec: line.estimateSec };
    const file = `${line.id}.wav`;
    trimTo(raw, join(audioDir, file));
    return { id: line.id, file, durationSec: probeSeconds(join(audioDir, file)) };
  });
  const manifest: AudioManifest = {
    voice,
    source: have.length > 0 ? "higgsfield" : "placeholder",
    lines,
    totalSec: Math.round(lines.reduce((s, l) => s + l.durationSec, 0) * 1000) / 1000,
  };
  writeFileSync(join(audioDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${manifest.source}: ${lines.length} lines, ${manifest.totalSec}s`);
}

main();
