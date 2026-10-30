import {
  HistoricalToggle,
  PoolSize,
  RangePicker,
  RegionPicker,
  SpicyToggle,
  TypePicker,
} from "@/components/generator/deck-filters";
import { MuteToggle } from "@/components/generator/mute-toggle";
import { CATEGORIES } from "@/lib/deck/categories";
import { clampRange } from "@/lib/deck/draw";
import {
  availableCountries,
  availableTypes,
  hasSpicy,
} from "@/lib/deck/entries";
import type { CategoryId } from "@/lib/deck/types";
import type { Generator } from "@/lib/hooks/use-generator";

function Setting({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="mb-caps text-[0.72em]">{label}</p>
      {children}
    </div>
  );
}

/** Only the controls a category actually has; filters render once prefs load. */
export function DeckSettings({
  category,
  generator: g,
}: {
  category: CategoryId;
  generator: Generator;
}) {
  const meta = CATEGORIES[category];

  return (
    <div className="space-y-5">
      {g.hydrated && meta.hasTypeFilter ? (
        <>
          <Setting label="Who counts">
            <TypePicker
              types={g.prefs.types}
              onTypes={(types) => g.savePrefs({ types })}
              available={availableTypes(category, {
                countries: g.prefs.countries,
                era: g.prefs.era,
                spicy: g.prefs.spicy,
              })}
            />
          </Setting>
          <Setting label="Era">
            <HistoricalToggle
              era={g.prefs.era}
              onEra={(era) => g.savePrefs({ era })}
            />
          </Setting>
        </>
      ) : null}

      {g.hydrated && meta.hasRegionFilter ? (
        <Setting label="Where from">
          <RegionPicker
            countries={g.prefs.countries}
            onCountries={(countries) => g.savePrefs({ countries })}
            availableCountries={availableCountries(category)}
          />
        </Setting>
      ) : null}

      {g.hydrated && (meta.hasTypeFilter || meta.hasRegionFilter) ? (
        <PoolSize size={g.poolSize} />
      ) : null}

      {g.hydrated && hasSpicy(category) ? (
        <Setting label="Spicy">
          <SpicyToggle
            spicy={g.prefs.spicy}
            onSpicy={(spicy) => g.savePrefs({ spicy })}
          />
        </Setting>
      ) : null}

      {g.hydrated && meta.hasRangeFilter ? (
        <Setting label="Range">
          <RangePicker
            min={g.prefs.min}
            max={g.prefs.max}
            onChange={(min, max) => {
              const [lo, hi] = clampRange(min, max);
              g.savePrefs({ min: lo, max: hi });
            }}
          />
        </Setting>
      ) : null}

      {!meta.hasRegionFilter && !meta.hasTypeFilter && !meta.hasRangeFilter ? (
        <p className="font-medium">
          One curated {meta.noun} deck. Nothing repeats until it runs out.
        </p>
      ) : null}

      <Setting label="Sound">
        <MuteToggle />
      </Setting>
    </div>
  );
}
