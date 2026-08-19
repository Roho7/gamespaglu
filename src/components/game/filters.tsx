"use client";

import { Chip } from "@/components/mb/ui";
import { Input } from "@/components/ui/input";
import { COUNTRIES, LANGUAGES } from "@/lib/countries";
import { CELEB_TYPES, ERAS } from "@/lib/celeb-types";
import type { CountryKey, EraFilter, LanguageKey, TypeKey } from "@/lib/types";

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

/**
 * What kind of famous.
 *
 * Uses the standard filter-bar pattern: an "All" chip plus the nine types.
 * Tapping a type while All is active selects that type *alone*, so a
 * cartoons-only round for the kids is one tap rather than eight deselections.
 * Tapping again inside a subset toggles normally.
 */
export function TypePicker({
  types,
  onTypes,
  available,
}: {
  types: TypeKey[];
  onTypes: (v: TypeKey[]) => void;
  available: TypeKey[];
}) {
  const offered = CELEB_TYPES.filter((t) => available.includes(t.key));
  const allSelected = offered.every((t) => types.includes(t.key));

  const tap = (key: TypeKey) => {
    if (allSelected) {
      onTypes([key]);
      return;
    }
    const on = types.includes(key);
    // Never allow zero selected — an empty pool is a dead end, not a state.
    if (on && types.length === 1) return;
    onTypes(on ? types.filter((t) => t !== key) : [...types, key]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Chip
        active={allSelected}
        onClick={() => onTypes(offered.map((t) => t.key))}
      >
        All
      </Chip>
      {offered.map((t) => (
        <Chip
          key={t.key}
          active={!allSelected && types.includes(t.key)}
          onClick={() => tap(t.key)}
        >
          {t.label}
        </Chip>
      ))}
    </div>
  );
}

/**
 * When they were famous. Separate from type on purpose: Drake is Music +
 * Modern, not a "recent people" bucket duplicated across every domain.
 * Entries marked evergreen answer to both.
 */
export function EraPicker({
  era,
  onEra,
}: {
  era: EraFilter;
  onEra: (v: EraFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ERAS.map((e) => (
        <Chip key={e.key} active={era === e.key} onClick={() => onEra(e.key)}>
          {e.label}
        </Chip>
      ))}
    </div>
  );
}
