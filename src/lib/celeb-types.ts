import type { EraFilter, TypeKey } from "./types";

export const CELEB_TYPES: { key: TypeKey; label: string }[] = [
  { key: "film", label: "Film & TV" },
  { key: "music", label: "Music" },
  { key: "sport", label: "Sport" },
  { key: "politics", label: "Leaders" },
  { key: "icon", label: "Icons" },
  { key: "internet", label: "Internet" },
  { key: "cartoon", label: "Cartoon" },
  { key: "anime", label: "Anime" },
  { key: "superhero", label: "Superhero" },
];

export const ALL_TYPES: TypeKey[] = CELEB_TYPES.map((t) => t.key);

export const ERAS: { key: EraFilter; label: string }[] = [
  { key: "both", label: "Both" },
  { key: "classic", label: "Classic" },
  { key: "modern", label: "Modern" },
];
