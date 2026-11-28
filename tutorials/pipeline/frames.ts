import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { gameDir, gameFromArgv, readJson } from "./paths";
import { AudioManifest, Dialogue } from "./schema";
import { lineTimes } from "./timing";

const FPS = 30;

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

  const clipOf = (id: string) => manifest.lines.find((l) => l.id === id)!;
  const placed = lineTimes(dialogue.lines, (line) => clipOf(line.id).durationSec, FPS);
  for (const [i, line] of dialogue.lines.entries()) {
    const clip = clipOf(line.id);
    const start = placed[i].startFrame / FPS;
    extract(start + 1, line.id);
    for (const cue of line.scene.cues ?? []) {
      extract(start + clip.words[cue.word].startSec + 0.3, `${line.id}--${cue.shot}`);
    }
    for (const zoom of line.scene.zooms ?? []) {
      const from = zoom.word === undefined ? 0 : clip.words[zoom.word].startSec;
      extract(start + from + 0.8, `${line.id}--zoom-${zoom.focus}`);
    }
  }
}

main();
