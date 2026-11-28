import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

import { gameDir, gameFromArgv, TUTORIALS_DIR } from "./paths";

const ffprobe = (file: string, entries: string, stream?: string) =>
  execFileSync(
    "ffprobe",
    ["-v", "error", ...(stream ? ["-select_streams", stream] : []), "-show_entries", entries, "-of", "csv=p=0", file],
    { encoding: "utf8" },
  ).trim();

async function main() {
  const game = gameFromArgv();
  const dir = gameDir(game);
  const outDir = join(dir, "out");
  mkdirSync(outDir, { recursive: true });

  const serveUrl = await bundle({
    entryPoint: join(TUTORIALS_DIR, "remotion/index.ts"),
    publicDir: dir,
  });
  const composition = await selectComposition({ serveUrl, id: "Tutorial", inputProps: { data: null } });

  let shown = -1;
  const output = join(outDir, `${game}-tutorial.mp4`);
  const rendered = join(outDir, "rendered.mp4");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    audioCodec: "aac",
    outputLocation: rendered,
    inputProps: { data: null },
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct > shown) {
        shown = pct;
        console.log(`render ${pct}%`);
      }
    },
  });

  if (ffprobe(rendered, "stream=index", "a:0") === "") {
    execFileSync("ffmpeg", [
      "-y", "-v", "error", "-i", rendered,
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-c:v", "copy", "-c:a", "aac", "-t", String(composition.durationInFrames / composition.fps),
      output,
    ]);
    rmSync(rendered);
  } else {
    renameSync(rendered, output);
  }
  console.log(output);
  console.log(`video ${ffprobe(output, "stream=duration", "v:0")}s, audio ${ffprobe(output, "stream=duration", "a:0")}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
