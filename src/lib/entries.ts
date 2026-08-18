import animalsRaw from "@/data/animals.json";
import objectsRaw from "@/data/objects.json";
import placesRaw from "@/data/places.json";
import moviesRaw from "@/data/movies.json";
import celebritiesRaw from "@/data/celebrities.json";
import type { CategoryId, CountryKey, Entry, LanguageKey } from "./types";

type RawObjectEntry = {
  label: string;
  countries: string[];
  languages?: string[];
  year?: number;
  tags?: string[];
};

function slug(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Flat lists are authored as plain strings — far less typing means longer lists. */
function fromStrings(labels: string[]): Entry[] {
  return labels.map((label) => ({
    id: slug(label),
    label,
    countries: ["worldwide"] as CountryKey[],
  }));
}

function fromObjects(rows: RawObjectEntry[]): Entry[] {
  return rows.map((r) => ({
    id: slug(r.label),
    label: r.label,
    countries: r.countries as CountryKey[],
    languages: r.languages as LanguageKey[] | undefined,
    year: r.year,
    tags: r.tags,
  }));
}

export const ENTRIES: Record<Exclude<CategoryId, "number">, Entry[]> = {
  animal: fromStrings(animalsRaw as string[]),
  object: fromStrings(objectsRaw as string[]),
  place: fromObjects(placesRaw as RawObjectEntry[]),
  movie: fromObjects(moviesRaw as RawObjectEntry[]),
  celebrity: fromObjects(celebritiesRaw as RawObjectEntry[]),
};

export function poolSizes() {
  return Object.fromEntries(
    Object.entries(ENTRIES).map(([k, v]) => [k, v.length]),
  ) as Record<Exclude<CategoryId, "number">, number>;
}
