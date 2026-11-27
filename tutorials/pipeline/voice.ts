import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { gameDir, gameFromArgv, readJson, TUTORIALS_DIR } from "./paths";
import { type AudioManifest, Dialogue, type Line, VoiceConfig } from "./schema";

const EXTENSIONS = ["mp3", "wav"] as const;

function clipFor(audioDir: string, id: string): string | null {
  const ext = EXTENSIONS.find((e) => existsSync(join(audioDir, `${id}.${e}`)));
  return ext ? `${id}.${ext}` : null;
}

function probeSeconds(file: string): number {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  return Number.parseFloat(out.trim());
}

function hasBinary(name: string): boolean {
  return spawnSync("which", [name]).status === 0;
}

async function generateWithHiggsfield(
  line: Line,
  model: string,
  voiceId: string,
  audioDir: string,
): Promise<void> {
  const out = execFileSync(
    "higgsfield",
    ["generate", "create", model, "--prompt", line.text, "--voice", voiceId, "--wait", "--json"],
    { encoding: "utf8" },
  );
  const result: unknown = JSON.parse(out);
  const url = findUrl(result);
  if (!url) throw new Error(`higgsfield returned no audio url for ${line.id}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed for ${line.id}: ${res.status}`);
  writeFileSync(join(audioDir, `${line.id}.mp3`), Buffer.from(await res.arrayBuffer()));
}

function findUrl(value: unknown): string | null {
  if (typeof value === "string") return /^https?:\/\//.test(value) ? value : null;
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) {
      const found = findUrl(v);
      if (found) return found;
    }
  }
  return null;
}

async function main() {
  const game = gameFromArgv();
  const dir = gameDir(game);
  const audioDir = join(dir, "audio");
  mkdirSync(audioDir, { recursive: true });

  const dialogue = readJson(join(dir, "dialogue.json"), Dialogue);
  const config = readJson(join(TUTORIALS_DIR, "voice.config.json"), VoiceConfig);

  const present = dialogue.lines.filter((l) => clipFor(audioDir, l.id));
  if (present.length === 0 && config.model && config.voiceId && hasBinary("higgsfield")) {
    console.warn("higgsfield generation has never run against the real service; check each clip");
    for (const line of dialogue.lines) {
      await generateWithHiggsfield(line, config.model, config.voiceId, audioDir);
    }
  }

  const clips = dialogue.lines.map((l) => ({ line: l, file: clipFor(audioDir, l.id) }));
  const have = clips.filter((c) => c.file);
  if (have.length > 0 && have.length < clips.length) {
    const missing = clips.filter((c) => !c.file).map((c) => c.line.id);
    throw new Error(`partial clips in tutorials/${game}/audio, missing: ${missing.join(", ")}`);
  }

  const real = have.length > 0;
  const lines = clips.map(({ line, file }) => ({
    id: line.id,
    file,
    durationSec: file ? probeSeconds(join(audioDir, file)) : line.estimateSec,
  }));
  const manifest: AudioManifest = {
    voice: config,
    source: real ? "higgsfield" : "placeholder",
    lines,
    totalSec: Math.round(lines.reduce((s, l) => s + l.durationSec, 0) * 1000) / 1000,
  };
  writeFileSync(join(audioDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${manifest.source}: ${lines.length} lines, ${manifest.totalSec}s`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
