import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { type Browser, chromium, type Locator, type Page } from "playwright";

import { gameDir } from "../pipeline/paths";
import type { Box, Markers } from "../pipeline/schema";

const VIEWPORT = { width: 432, height: 768 };
const SCALE = 2.5;
const OUTPUT = { width: VIEWPORT.width * SCALE, height: VIEWPORT.height * SCALE };
const FPS = 30;

const DETERMINISTIC_RANDOM_SCRIPT = `(() => {
  let a = 0x9e3779b9;
  Math.random = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

export type Recording = {
  page: Page;
  game: string;
  mark: (shot: string) => Promise<void>;
  dwell: (sec: number) => Promise<void>;
  focus: (name: string, target: Locator) => Promise<void>;
  baseUrl: string;
};

type Frame = { file: string; at: number };

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function encode(dir: string, framesDir: string, frames: Frame[], endAt: number, footage: string) {
  const list = frames.map((f, i) => {
    const next = frames[i + 1]?.at ?? endAt;
    return `file '${f.file}'\nduration ${Math.max(next - f.at, 0.001).toFixed(4)}`;
  });
  list.push(`file '${frames.at(-1)!.file}'`);
  const listFile = join(dir, "frames.txt");
  writeFileSync(listFile, `${list.join("\n")}\n`);
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listFile,
    "-vf", `fps=${FPS},scale=${OUTPUT.width}:${OUTPUT.height}:flags=lanczos,format=yuv420p`,
    "-fps_mode", "cfr", "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-g", "15", "-movflags", "+faststart", "-an", footage,
  ]);
  rmSync(listFile);
  rmSync(framesDir, { recursive: true, force: true });
}

/** Drive `script` against the app in a 9:16 mobile viewport and write `capture/footage.mp4` plus `markers.json`. */
export async function record(
  game: string,
  script: (rec: Recording) => Promise<void>,
): Promise<Markers> {
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const dir = join(gameDir(game), "capture");
  const framesDir = join(dir, "frames");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  const browser: Browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(DETERMINISTIC_RANDOM_SCRIPT);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const frames: Frame[] = [];
  cdp.on("Page.screencastFrame", (frame) => {
    const file = `${String(frames.length).padStart(6, "0")}.jpg`;
    writeFileSync(join(framesDir, file), Buffer.from(frame.data, "base64"));
    frames.push({ file: join("frames", file), at: frame.metadata.timestamp ?? Date.now() / 1000 });
    void cdp.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
  });
  const t0 = Date.now() / 1000;
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 90,
    maxWidth: OUTPUT.width,
    maxHeight: OUTPUT.height,
    everyNthFrame: 1,
  });
  const now = () => round3(Date.now() / 1000 - t0);
  const shots: Record<string, number> = {};
  const unshot: string[] = [];
  const ends: Record<string, number> = {};
  const focus: Record<string, Box> = {};
  let current: string | null = null;

  const rec: Recording = {
    page,
    game,
    baseUrl,
    dwell: async (sec) => {
      const pending = unshot.splice(0);
      await page.waitForTimeout((sec * 1000) / 2);
      for (const shot of pending) {
        await page.screenshot({ path: join(dir, `${shot}.png`) });
      }
      await page.waitForTimeout((sec * 1000) / 2);
      if (current) ends[current] = now();
    },
    focus: async (name, target) => {
      const box = await target.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const text = range.getBoundingClientRect();
        const r = text.width > 0 && text.height > 0 ? text : el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
      });
      if (!box) throw new Error(`focus "${name}" is not visible`);
      const unit = (n: number) => Math.min(1, Math.max(0, round3(n)));
      const x = unit(box.x / VIEWPORT.width);
      const y = unit(box.y / VIEWPORT.height);
      focus[name] = {
        x,
        y,
        w: unit(Math.min(box.width / VIEWPORT.width, 1 - x)),
        h: unit(Math.min(box.height / VIEWPORT.height, 1 - y)),
      };
    },
    mark: async (shot) => {
      current = shot;
      shots[shot] = now();
      unshot.push(shot);
    },
  };

  let endAt: number;
  try {
    await script(rec);
    shots.end = now();
    current = null;
    await page.waitForTimeout(300);
    endAt = Date.now() / 1000;
  } finally {
    await cdp.send("Page.stopScreencast").catch(() => undefined);
    await browser.close();
  }

  const relative = frames
    .map((f) => ({ file: f.file, at: Math.max(0, f.at - t0) }))
    .sort((a, b) => a.at - b.at);
  relative[0].at = 0;
  encode(dir, framesDir, relative, endAt - t0, join(dir, "footage.mp4"));

  const markers: Markers = { game, file: "footage.mp4", fps: FPS, shots, ends, focus };
  writeFileSync(join(dir, "markers.json"), `${JSON.stringify(markers, null, 2)}\n`);
  return markers;
}
