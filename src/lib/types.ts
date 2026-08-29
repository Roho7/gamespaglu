/** One drawable thing. Kept deliberately wide so future games can reuse the data. */
export type Entry = {
  id: string;
  label: string;
  /** ISO-ish country keys, or "worldwide". */
  countries: CountryKey[];
  year?: number;
  /** What kind of famous this is. Drives the type chips. */
  types?: TypeKey[];
  /** When they were famous. "evergreen" matches both era filters. */
  era?: Era;
  /**
   * Famous primarily FOR a crime or a scandal. Deliberately its own axis, not a
   * TypeKey: Diddy is still Music and Epstein is still an Icon, and folding
   * notoriety into "what kind of famous" would collapse two questions into one
   * — the same mistake that keeping `types` and `era` apart avoids.
   *
   * Excluded unless the player switches it on. A round about sex trafficking,
   * said out loud in a room, ends the game.
   */
  spicy?: boolean;
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
  | "icon"
  | "internet"
  | "cartoon"
  | "anime"
  | "superhero";

export type Era = "classic" | "modern" | "evergreen";
/** What the user can choose. "both" is the default. */
export type EraFilter = "classic" | "modern" | "both";

/**
 * Where something is a *household name* — not where it came from. A film that
 * everyone knows everywhere is `worldwide`, whatever language it was shot in.
 *
 * There is deliberately no language axis. Content is curated for how widely
 * recognised it is, not where it is from (see CLAUDE.md, "popularity over
 * locality") — a regional-industry filter cut the deck along a line nobody in
 * the room cares about.
 */
export type CountryKey = "in" | "us" | "gb" | "kr" | "jp" | "worldwide";

export type CategoryId =
  | "number"
  | "place"
  | "movie"
  | "celebrity"
  | "animal"
  | "object";

export type Filters = {
  countries?: CountryKey[];
  types?: TypeKey[];
  era?: EraFilter;
  /** Off by default — see Entry.spicy. */
  spicy?: boolean;
  min?: number;
  max?: number;
};
