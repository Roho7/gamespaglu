import { expect } from "vitest";
import type { ErrorCode } from "../../../shared/protocol";
import { GameError } from "../game/errors";

/** A replayable rng, so every deal in a test can be reproduced. */
export const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** Seats named after their ids, for deals that do not care about names. */
export const seats = (ids: string[]) => ids.map((id) => ({ id, name: id }));

/** Returns the same value every time, which lets a test choose exactly who is dealt what. */
export const fixed = (v: number) => () => v;

export function expectRefusal(code: ErrorCode, fn: () => unknown) {
  let thrown: unknown = null;
  try {
    fn();
  } catch (e) {
    thrown = e;
  }
  expect(thrown).toBeInstanceOf(GameError);
  expect((thrown as GameError).code).toBe(code);
}

export async function expectRefusalAsync(code: ErrorCode, fn: () => Promise<unknown>) {
  const thrown = await fn().then(
    () => null,
    (e: unknown) => e,
  );
  expect(thrown).toBeInstanceOf(GameError);
  expect((thrown as GameError).code).toBe(code);
}
