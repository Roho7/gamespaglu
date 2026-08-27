import manifest from "@/data/stickers.json";
import type { CategoryId } from "./types";

/**
 * Stickers are downloaded once by `npm run stickers` and served from
 * public/stickers, never fetched from GIPHY at runtime — a round should never
 * wait on the network, and the PWA has to work at a party with no signal.
 *
 * The manifest is rebuilt from what is actually on disk, so curating is just
 * deleting files you don't like and re-running the script.
 */
export type Sticker = { src: string; title?: string; url?: string };

const BY_CATEGORY = manifest as Partial<Record<CategoryId, Sticker[]>>;

export function stickersFor(category: CategoryId): Sticker[] {
  return BY_CATEGORY[category] ?? [];
}

export function hasStickers(category: CategoryId): boolean {
  return stickersFor(category).length > 0;
}
