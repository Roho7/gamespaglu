import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { type Browser, chromium, type Page } from "playwright";

import { gameDir } from "../pipeline/paths";
import type { Markers } from "../pipeline/schema";

const VIEWPORT = { width: 390, height: 844 };
const FOOTAGE_SIZE = { width: 780, height: 1688 };
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
  baseUrl: string;
};

export async function record(
  game: string,
  script: (rec: Recording) => Promise<void>,
): Promise<Markers> {
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const dir = join(gameDir(game), "capture");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const browser: Browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: { dir, size: VIEWPORT },
  });
  await context.addInitScript(DETERMINISTIC_RANDOM_SCRIPT);
  const page = await context.newPage();
  const t0 = Date.now();
  const shots: Record<string, number> = {};
  const unshot: string[] = [];

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
    },
    mark: async (shot) => {
      shots[shot] = Math.round(((Date.now() - t0) / 1000) * 1000) / 1000;
      unshot.push(shot);
    },
  };

  let raw: string;
  try {
    await script(rec);
    shots.end = Math.round(((Date.now() - t0) / 1000) * 1000) / 1000;
  } finally {
    const video = page.video();
    await context.close();
    raw = (await video?.path()) ?? "";
    await browser.close();
  }

  const footage = join(dir, "footage.webm");
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-i", raw,
    "-r", String(FPS),
    "-vf", `scale=${FOOTAGE_SIZE.width}:${FOOTAGE_SIZE.height}:flags=lanczos`, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32",
    "-deadline", "realtime", "-cpu-used", "5", "-row-mt", "1", "-g", "15", "-an", footage,
  ]);
  rmSync(raw);

  const markers: Markers = { game, file: "footage.webm", fps: FPS, shots };
  writeFileSync(join(dir, "markers.json"), `${JSON.stringify(markers, null, 2)}\n`);
  return markers;
}

