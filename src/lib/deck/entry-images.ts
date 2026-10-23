import images from "@shared/data/images.json";
import type { CategoryId } from "@/lib/deck/types";

const COMMONS_THUMBS = "https://upload.wikimedia.org/wikipedia/commons/thumb";
const COMMONS_FILES = "https://commons.wikimedia.org/wiki/File:";
const PATHS: Record<string, string> = images;

export type EntryImage = {
  /** A 330px Commons thumbnail; dithering hides anything sharper. */
  src: string;
  /** The file's Commons page, which carries its author and licence. */
  credit: string;
};

/** The photo matched to an entry ahead of time by `build-data.mjs images`. */
export function entryImage(
  category: CategoryId,
  id: string,
): EntryImage | undefined {
  const path = PATHS[`${category}:${id}`];
  if (!path) return undefined;
  const cut = path.lastIndexOf("/");
  const name = encodeURIComponent(path.slice(cut + 1));
  const rendered = /\.svg$/i.test(path) ? `${name}.png` : name;
  return {
    src: `${COMMONS_THUMBS}/${path.slice(0, cut)}/${name}/330px-${rendered}`,
    credit: `${COMMONS_FILES}${name}`,
  };
}
