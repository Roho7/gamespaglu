"use client";

import { Chip } from "@/components/mb/ui";
import { Input } from "@/components/ui/input";
import { COUNTRIES, LANGUAGES } from "@/lib/countries";
import type { CountryKey, LanguageKey } from "@/lib/types";

export function RegionPicker({
  countries,
  languages,
  onCountries,
  onLanguages,
  poolSize,
  showLanguages,
  availableCountries,
  availableLanguages,
}: {
  countries: CountryKey[];
  languages: LanguageKey[];
  onCountries: (v: CountryKey[]) => void;
  onLanguages: (v: LanguageKey[]) => void;
  poolSize: number;
  showLanguages: boolean;
  /** Only chips backed by real entries are offered. */
  availableCountries: CountryKey[];
  availableLanguages: LanguageKey[];
}) {
  const toggleCountry = (key: CountryKey) => {
    const on = countries.includes(key);
    // Never allow zero selected — an empty pool is a dead end, not a state.
    if (on && countries.length === 1) return;
    onCountries(on ? countries.filter((c) => c !== key) : [...countries, key]);
  };

  const toggleLanguage = (key: LanguageKey) => {
    const on = languages.includes(key);
    if (on && languages.length === 1) return;
    onLanguages(on ? languages.filter((l) => l !== key) : [...languages, key]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COUNTRIES.filter((c) => availableCountries.includes(c.key)).map((c) => (
          <Chip
            key={c.key}
            active={countries.includes(c.key)}
            onClick={() => toggleCountry(c.key)}
          >
            <span aria-hidden>{c.flag}</span>
            {c.label}
          </Chip>
        ))}
      </div>

      {showLanguages && countries.includes("in") ? (
        <div className="space-y-2">
          <p className="mb-caps text-[0.6rem] opacity-60">
            Indian languages
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.filter((l) => availableLanguages.includes(l.key)).map((l) => (
              <Chip
                key={l.key}
                active={languages.includes(l.key)}
                onClick={() => toggleLanguage(l.key)}
              >
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mb-caps text-[0.6rem] opacity-60">
        {poolSize} in the deck
      </p>
    </div>
  );
}

const PRESETS: [number, number][] = [
  [1, 10],
  [1, 50],
  [1, 100],
  [1, 1000],
];

export function RangePicker({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const isPreset = PRESETS.some(([a, b]) => a === min && b === max);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([a, b]) => (
          <Chip
            key={`${a}-${b}`}
            active={min === a && max === b}
            onClick={() => onChange(a, b)}
          >
            {a}–{b}
          </Chip>
        ))}
        <Chip active={!isPreset} onClick={() => onChange(min, max)}>
          Custom
        </Chip>
      </div>

      {!isPreset ? (
        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="sr-only">Minimum</span>
            <Input
              type="number"
              inputMode="numeric"
              value={min}
              onChange={(e) => onChange(Number(e.target.value), max)}
            />
          </label>
          <span className="font-extrabold">→</span>
          <label className="flex-1">
            <span className="sr-only">Maximum</span>
            <Input
              type="number"
              inputMode="numeric"
              value={max}
              onChange={(e) => onChange(min, Number(e.target.value))}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
