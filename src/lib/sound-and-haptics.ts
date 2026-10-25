"use client";

import { store } from "@/lib/state-adapter";

/**
 * Countdown ticks and the reveal hit. Synthesised with WebAudio rather than
 * shipped as files — no assets, no licensing, no cache weight.
 *
 * iOS only allows audio after a user gesture, so the context is created on the
 * tap that starts the countdown. Vibration is Android-only in practice; it is a
 * silent no-op on iOS Safari and that is acceptable.
 */
let ctx: AudioContext | null = null;

export const MUTE_KEY = "muted";

function isMuted(): boolean {
  return store.get<boolean>(MUTE_KEY, false);
}
/** Call from the click handler that begins a round, to unlock audio on iOS. */
export function primeAudio() {
  if (typeof window === "undefined" || isMuted()) return;
  try {
    type WithWebkit = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor =
      window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, durationMs: number, gain: number) {
  if (isMuted()) return;
  primeAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {}
}

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export function tick() {
  tone(660, 90, 0.16);
  buzz(18);
}

export function revealHit() {
  tone(180, 260, 0.22);
  buzz([32, 26, 46]);
}

export function blip() {
  tone(880, 45, 0.1);
  buzz(10);
}

/** Night falls in a room game: a low fall, and the same long buzz on every phone. */
export function nightFalls() {
  tone(220, 180, 0.18);
  setTimeout(() => tone(147, 420, 0.18), 160);
  buzz([60, 40, 120]);
}

/** Morning in a room game: a bright rise. */
export function dayBreaks() {
  tone(523, 120, 0.14);
  setTimeout(() => tone(784, 220, 0.14), 110);
  buzz([20, 30, 20]);
}
