/** One drawable thing. Kept deliberately wide so future games can reuse the data. */
export type Entry = {
  id: string;
  label: string;
  /** ISO-ish country keys, or "worldwide". */
  countries: CountryKey[];
  /** Indian language industries, for movies and film celebrities. */
  languages?: LanguageKey[];
  year?: number;
  /** Free-form: "cricket", "music", "politics", "landmark", "city"… */
  tags?: string[];
};

export type CountryKey = "in" | "us" | "gb" | "kr" | "jp" | "worldwide";
export type LanguageKey = "hi" | "ta" | "te" | "ml" | "kn";

export type CategoryId =
  | "number"
  | "place"
  | "movie"
  | "celebrity"
  | "animal"
  | "object";

export type Filters = {
  countries?: CountryKey[];
  languages?: LanguageKey[];
  min?: number;
  max?: number;
};
