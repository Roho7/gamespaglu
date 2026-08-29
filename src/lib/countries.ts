import type { CountryKey } from "./types";

export const COUNTRIES: { key: CountryKey; flag: string; label: string }[] = [
  { key: "in", flag: "🇮🇳", label: "India" },
  { key: "us", flag: "🇺🇸", label: "USA" },
  { key: "gb", flag: "🇬🇧", label: "UK" },
  { key: "kr", flag: "🇰🇷", label: "Korea" },
  { key: "jp", flag: "🇯🇵", label: "Japan" },
  { key: "worldwide", flag: "🌍", label: "Worldwide" },
];

/**
 * Everything, on purpose. The old default was India+USA, which quietly made the
 * site a regional product and — worse — was the saved value that filtered the
 * animal and object decks to zero. Starting from the whole deck is both the
 * honest default and the safe one.
 */
export const DEFAULT_COUNTRIES: CountryKey[] = COUNTRIES.map((c) => c.key);
