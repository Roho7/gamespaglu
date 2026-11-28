import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";
import { downloadWhisperModel } from "@remotion/install-whisper-cpp";

import { TUTORIALS_DIR } from "./paths";
import { scriptWords, type Word } from "./schema";

const WHISPER_VERSION = "1.5.5";
const MODEL = "small.en";
const PAUSE_SEC = 0.3;
const SEC_PER_CHAR = 0.07;
const CRAMMED_SEC = 0.12;
const WHISPER_DIR = join(TUTORIALS_DIR, ".whisper");
const MIN_MATCH = 0.7;

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function spell(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ONES[n % 10] : "");
}

function normalise(word: string): string[] {
  const lower = word.toLowerCase();
  const numbers = lower.match(/\d+/g);
  if (numbers && /^[\d\s\p{P}]+$/u.test(lower)) return numbers.map((n) => spell(Number(n)));
  const flat = lower.replace(/[^a-z0-9]/g, "");
  return flat ? [flat] : [];
}

type Heard = { key: string; startSec: number; endSec: number };

type Gap = { start: number; end: number };

type Caption = { text: string; startMs: number; endMs: number };

function joinTokens(captions: Caption[]): Caption[] {
  const words: Caption[] = [];
  for (const c of captions) {
    const last = words.at(-1);
    if (last && !/^\s/.test(c.text)) words[words.length - 1] = { ...last, text: last.text + c.text, endMs: c.endMs };
    else words.push({ ...c });
  }
  return words;
}

function heardWords(captions: Caption[]): Heard[] {
  return joinTokens(captions).flatMap((c) =>
    normalise(c.text).map((key) => ({ key, startSec: c.startMs / 1000, endSec: c.endMs / 1000 })),
  );
}

function matchPairs(script: string[], heard: Heard[]): Map<number, number> {
  const n = script.length;
  const m = heard.length;
  const table = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] =
        script[i] === heard[j].key ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs = new Map<number, number>();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (script[i] === heard[j].key) pairs.set(i++, j++);
    else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

function spread(words: string[], from: number, to: number): Pick<Word, "startSec" | "endSec">[] {
  const weights = words.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, "").length));
  const total = weights.reduce((a, b) => a + b, 0);
  let at = from;
  return weights.map((w) => {
    const startSec = at;
    at += ((to - from) * w) / total;
    return { startSec, endSec: at };
  });
}

/** Evenly-by-characters word timings for a clip of `durationSec`, used when there is no audio to align. */
export function estimateWords(text: string, durationSec: number): Word[] {
  const words = scriptWords(text);
  return spread(words, 0, durationSec).map((t, i) => ({ text: words[i], ...t }));
}

/** Map whisper's heard words onto the script's words; unmatched script words are interpolated between neighbours. */
export function alignWords(id: string, text: string, heard: Heard[], durationSec: number, gaps: Gap[] = []): Word[] {
  const words = scriptWords(text);
  const keys = words.map((w) => normalise(w).join(""));
  const pairs = matchPairs(keys, heard);
  if (pairs.size / words.length < MIN_MATCH) {
    throw new Error(`clip ${id} doesn't match its text (${pairs.size}/${words.length} words matched)`);
  }
  const timed: (Pick<Word, "startSec" | "endSec"> | null)[] = words.map((_, i) => {
    const j = pairs.get(i);
    return j === undefined ? null : { startSec: heard[j].startSec, endSec: heard[j].endSec };
  });
  let i = 0;
  while (i < words.length) {
    if (timed[i]) {
      i++;
      continue;
    }
    let end = i;
    while (end < words.length && !timed[end]) end++;
    const to = end < words.length ? timed[end]!.startSec : durationSec;
    const after = i > 0 ? timed[i - 1]!.endSec : 0;
    const pause = gaps.find((g) => g.start >= after - 0.05 && g.end < to);
    const from = pause ? pause.end : after;
    spread(words.slice(i, end), from, Math.max(from, to)).forEach((t, k) => {
      timed[i + k] = t;
    });
    i = end;
  }
  return words.map((w, k) => {
    const t = timed[k]!;
    const startSec = Math.min(durationSec, Math.max(0, t.startSec));
    return { text: w, startSec, endSec: Math.min(durationSec, Math.max(startSec, t.endSec)) };
  });
}

function pauses(file: string): Gap[] {
  const log = spawnSync(
    "ffmpeg",
    ["-i", file, "-af", `silencedetect=noise=-38dB:d=${PAUSE_SEC}`, "-f", "null", "-"],
    { encoding: "utf8" },
  ).stderr;
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number.parseFloat(m[1]));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number.parseFloat(m[1]));
  return starts.flatMap((start, i) => (ends[i] === undefined ? [] : [{ start, end: ends[i] }]));
}

function pullBackFromPauses(words: Word[], gaps: Gap[]): Word[] {
  const out = words.map((w) => ({ ...w }));
  for (const gap of gaps) {
    const k = out.findIndex(
      (w, i) =>
        i + 1 < out.length &&
        w.startSec > gap.start + 0.02 &&
        w.startSec <= gap.end &&
        out[i + 1].startSec - w.startSec < CRAMMED_SEC,
    );
    if (k < 0) continue;
    const chars = out[k].text.replace(/[^\p{L}\p{N}]/gu, "").length;
    const floor = k > 0 ? out[k - 1].startSec + 0.1 : 0;
    out[k].startSec = Math.max(floor, gap.start - chars * SEC_PER_CHAR);
    out[k].endSec = Math.max(out[k].startSec, gap.start);
  }
  return out;
}

let ready: Promise<void> | null = null;

function ensureWhisper(): Promise<void> {
  ready ??= (async () => {
    mkdirSync(join(WHISPER_DIR, "models"), { recursive: true });
    await installWhisperCpp({ version: WHISPER_VERSION, to: join(WHISPER_DIR, "whisper.cpp") });
    await downloadWhisperModel({ model: MODEL, folder: join(WHISPER_DIR, "models") });
  })();
  return ready;
}

/** Transcribe a clip locally with whisper.cpp and align it to the script's words. */
export async function wordTimings(id: string, text: string, clip: string, durationSec: number): Promise<Word[]> {
  await ensureWhisper();
  const tmp = mkdtempSync(join(tmpdir(), "whisper-"));
  try {
    const input = join(tmp, "in.wav");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", clip, "-ar", "16000", "-ac", "1", input]);
    const output = await transcribe({
      inputPath: input,
      whisperPath: join(WHISPER_DIR, "whisper.cpp"),
      whisperCppVersion: WHISPER_VERSION,
      model: MODEL,
      modelFolder: join(WHISPER_DIR, "models"),
      tokenLevelTimestamps: true,
      language: "en",
    });
    const gaps = pauses(clip);
    const aligned = alignWords(id, text, heardWords(toCaptions({ whisperCppOutput: output }).captions), durationSec, gaps);
    return pullBackFromPauses(aligned, gaps);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
