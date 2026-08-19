import animalsRaw from "@/data/animals.json";
import objectsRaw from "@/data/objects.json";
import placesRaw from "@/data/places.json";
import moviesRaw from "@/data/movies.json";
import celebritiesRaw from "@/data/celebrities.json";
import type {
  CategoryId,
  CountryKey,
  Entry,
  Era,
  EraFilter,
  LanguageKey,
  TypeKey,
} from "./types";

type RawObjectEntry = {
  label: string;
  countries: string[];
  languages?: string[];
  year?: number;
  types?: string[];
  era?: string;
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
    types: r.types as TypeKey[] | undefined,
    era: r.era as Era | undefined,
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

/**
 * Which chips a category can offer, derived from its own data rather than
 * hardcoded. No movie is tagged "worldwide", so offering that chip on the movie
 * picker produced an empty deck and a Generate button that silently did
 * nothing. Deriving it means the picker stays honest as the lists grow.
 */
export function availableCountries(
  category: Exclude<CategoryId, "number">,
): CountryKey[] {
  const seen = new Set<CountryKey>();
  for (const e of ENTRIES[category]) for (const c of e.countries) seen.add(c);
  return [...seen];
}

export function availableLanguages(
  category: Exclude<CategoryId, "number">,
): LanguageKey[] {
  const seen = new Set<LanguageKey>();
  for (const e of ENTRIES[category]) {
    for (const l of e.languages ?? []) seen.add(l);
  }
  return [...seen];
}

/**
 * Which type chips are worth offering *given the other active filters*.
 *
 * There are no classic internet personalities — internet fame is inherently
 * modern — so under Era: Classic the Internet chip must not appear at all.
 * Offering it produced an empty deck and a Generate button that did nothing.
 */
export function availableTypes(
  category: Exclude<CategoryId, "number">,
  filters?: { countries?: CountryKey[]; languages?: LanguageKey[]; era?: EraFilter },
): TypeKey[] {
  const countries = filters?.countries;
  const languages = filters?.languages;
  const era = filters?.era ?? "both";

  const seen = new Set<TypeKey>();
  for (const entry of ENTRIES[category]) {
    if (countries?.length && !entry.countries.some((c) => countries.includes(c))) {
      continue;
    }
    if (
      languages?.length &&
      entry.languages?.length &&
      !entry.languages.some((l) => languages.includes(l))
    ) {
      continue;
    }
    if (era !== "both" && entry.era && entry.era !== "evergreen" && entry.era !== era) {
      continue;
    }
    for (const t of entry.types ?? []) seen.add(t);
  }
  return [...seen];
}

export function poolSizes() {
  return Object.fromEntries(
    Object.entries(ENTRIES).map(([k, v]) => [k, v.length]),
  ) as Record<Exclude<CategoryId, "number">, number>;
}
