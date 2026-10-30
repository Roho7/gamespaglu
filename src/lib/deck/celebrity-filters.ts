import type { TypeKey } from "@/lib/deck/types";

/** `optIn` kinds stay out of the default deck until a player taps them in. */
export const CELEB_TYPES: { key: TypeKey; label: string; optIn?: boolean }[] = [
  { key: "film", label: "Film & TV" },
  { key: "music", label: "Music" },
  { key: "sport", label: "Sport" },
  { key: "icon", label: "Icons" },
  { key: "internet", label: "Internet" },
  { key: "cartoon", label: "Cartoon" },
  { key: "anime", label: "Anime", optIn: true },
  { key: "superhero", label: "Superhero", optIn: true },
];

export const ALL_TYPES: TypeKey[] = CELEB_TYPES.map((t) => t.key);

export const DEFAULT_TYPES: TypeKey[] = CELEB_TYPES.filter((t) => !t.optIn).map(
  (t) => t.key,
);
