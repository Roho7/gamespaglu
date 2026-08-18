"use client";

import Link from "next/link";
import { BrutalButton, Panel } from "@/components/brutal";
import { FitText } from "@/components/fit-text";
import { RangePicker, RegionPicker } from "@/components/game/filters";
import { CATEGORIES } from "@/lib/categories";
import { clampRange } from "@/lib/draw";
import { useGenerator } from "@/lib/use-generator";
import type { CategoryId } from "@/lib/types";

/**
 * The standalone-page face of the same engine: no countdown, no full-screen
 * takeover, result shown in place.
 */
export function GeneratorWidget({ category }: { category: CategoryId }) {
  const meta = CATEGORIES[category];
  const g = useGenerator(category, { countdown: false });
  const accent = `var(${meta.accentVar})`;

  return (
    <div
      className="space-y-4"
      style={{ ["--accent-flood" as string]: accent }}
    >
      <div
        className="brutal flex h-44 items-center justify-center p-4 text-[var(--on-accent)]"
        style={{ background: accent }}
      >
        {g.label ? (
          <div className="relative h-full w-full">
            <FitText
              text={g.label}
              className="display text-center text-[var(--on-accent)]"
              max={120}
            />
          </div>
        ) : (
          <p className="display text-center text-xl opacity-40">
            Tap generate
          </p>
        )}
      </div>

      <BrutalButton variant="solid" size="xl" onClick={g.generate}>
        Generate
      </BrutalButton>

      {g.hydrated && meta.hasRegionFilter ? (
        <Panel className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">
            Where from
          </p>
          <RegionPicker
            countries={g.prefs.countries}
            languages={g.prefs.languages}
            onCountries={(countries) => g.savePrefs({ countries })}
            onLanguages={(languages) => g.savePrefs({ languages })}
            poolSize={g.poolSize}
            showLanguages={meta.hasLanguageFilter}
          />
        </Panel>
      ) : null}

      {g.hydrated && meta.hasRangeFilter ? (
        <Panel className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">
            Range
          </p>
          <RangePicker
            min={g.prefs.min}
            max={g.prefs.max}
            onChange={(min, max) => {
              const [lo, hi] = clampRange(min, max);
              g.savePrefs({ min: lo, max: hi });
            }}
          />
        </Panel>
      ) : null}

      <Link href={`/who-am-i/${category}`} className="block">
        <BrutalButton variant="accent" size="xl" className="text-2xl">
          Play Who Am I? with this →
        </BrutalButton>
      </Link>
    </div>
  );
}
