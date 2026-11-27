import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { gameDir, gameFromArgv, readJson } from "./paths";
import { AudioManifest, Dialogue } from "./schema";

const FPS = 30;
const GAP_SEC = 0.25;

function main() {
  const game = gameFromArgv();
  const dir = gameDir(game);
  const dialogue = readJson(join(dir, "dialogue.json"), Dialogue);
  const manifest = readJson(join(dir, "audio/manifest.json"), AudioManifest);
  const video = join(dir, "out", `${game}-tutorial.mp4`);
  const out = join(dir, "out", "frames");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const extract = (at: number, name: string) => {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", at.toFixed(3), "-i", video, "-frames:v", "1", join(out, `${name}.png`)]);
    console.log(`${at.toFixed(2).padStart(7)}s  ${name}`);
  };

  let cursor = 0;
  for (const line of dialogue.lines) {
    const clip = manifest.lines.find((l) => l.id === line.id)!;
    const start = cursor / FPS;
    extract(start + 1, line.id);
    for (const cue of line.scene.cues ?? []) {
      extract(start + clip.words[cue.word].startSec + 0.3, `${line.id}--${cue.shot}`);
    }
    cursor += Math.ceil((clip.durationSec + GAP_SEC) * FPS);
  }
}

main();
