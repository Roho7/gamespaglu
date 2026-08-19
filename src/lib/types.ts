/** One drawable thing. Kept deliberately wide so future games can reuse the data. */
export type Entry = {
  id: string;
  label: string;
  /** ISO-ish country keys, or "worldwide". */
  countries: CountryKey[];
  /** Indian language industries, for movies and film celebrities. */
  languages?: LanguageKey[];
  year?: number;
  /** What kind of famous this is. Drives the type chips. */
  types?: TypeKey[];
  /** When they were famous. "evergreen" matches both era filters. */
  era?: Era;
  /** Free-form: "landmark", "city", "country"… */
  tags?: string[];
};

/**
 * The nine kinds of famous. Two axes are kept deliberately separate: this is
 * WHAT someone is, and `era` is WHEN — otherwise "recent people" would need
 * duplicating across every domain.
 *
 * cartoon vs anime follows audience convention, not technical accuracy:
 * Doraemon and Shinchan are Japanese animation but every Indian player calls
 * them cartoons, and the filter has to match how the room thinks.
 */
export type TypeKey =
  | "film"
  | "music"
  | "sport"
  | "politics"
  | "icon"
  | "internet"
  | "cartoon"
  | "anime"
  | "superhero";

export type Era = "classic" | "modern" | "evergreen";
/** What the user can choose. "both" is the default. */
export type EraFilter = "classic" | "modern" | "both";

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
  types?: TypeKey[];
  era?: EraFilter;
  min?: number;
  max?: number;
};
