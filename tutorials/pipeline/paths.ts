import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { z } from "zod";

export const TUTORIALS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

export function gameFromArgv(): string {
  const game = process.argv.slice(2).find((a) => !a.startsWith("-"));
  if (!game) throw new Error("usage: npm run <stage> -- <game>");
  try {
    readFileSync(join(TUTORIALS_DIR, game, "dialogue.json"));
  } catch {
    throw new Error(`tutorials/${game}/dialogue.json not found`);
  }
  return game;
}

export const gameDir = (game: string) => join(TUTORIALS_DIR, game);

export function readJson<T extends z.ZodType>(file: string, schema: T): z.infer<T> {
  return schema.parse(JSON.parse(readFileSync(file, "utf8")));
}
