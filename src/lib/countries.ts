import type { CountryKey, LanguageKey } from "./types";

export const COUNTRIES: { key: CountryKey; flag: string; label: string }[] = [
  { key: "in", flag: "🇮🇳", label: "India" },
  { key: "us", flag: "🇺🇸", label: "USA" },
  { key: "gb", flag: "🇬🇧", label: "UK" },
  { key: "kr", flag: "🇰🇷", label: "Korea" },
  { key: "jp", flag: "🇯🇵", label: "Japan" },
  { key: "worldwide", flag: "🌍", label: "Worldwide" },
];

export const LANGUAGES: { key: LanguageKey; label: string }[] = [
  { key: "hi", label: "Hindi" },
  { key: "ta", label: "Tamil" },
  { key: "te", label: "Telugu" },
  { key: "ml", label: "Malayalam" },
  { key: "kn", label: "Kannada" },
];

export const ALL_LANGUAGES: LanguageKey[] = LANGUAGES.map((l) => l.key);
export const DEFAULT_COUNTRIES: CountryKey[] = ["in", "us"];
