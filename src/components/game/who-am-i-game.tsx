"use client";

import Link from "next/link";
import { BrutalButton, Panel, TopBar } from "@/components/brutal";
import { FitText } from "@/components/fit-text";
import { MuteToggle } from "@/components/mute-toggle";
import { HowToPlay } from "@/components/game/how-to-play";
import { RangePicker, RegionPicker } from "@/components/game/filters";
import { CATEGORIES } from "@/lib/categories";
import { clampRange } from "@/lib/draw";
import { useGenerator } from "@/lib/use-generator";
import { useWakeLock } from "@/lib/use-wake-lock";
import type { CategoryId } from "@/lib/types";

export function WhoAmIGame({ category }: { category: CategoryId }) {
  const meta = CATEGORIES[category];
  const g = useGenerator(category);

  // A phone on a forehead gets no touches; hold the screen awake while a word
  // is up (and through the countdown, so it never sleeps mid-raise).
  useWakeLock(g.phase !== "idle");

  const accent = `var(${meta.accentVar})`;

  if (g.phase === "reveal" && g.label) {
    return (
      <main
        className="flex min-h-dvh flex-col"
        style={{ ["--accent-flood" as string]: accent, background: accent }}
      >
        <div className="animate-slam flex flex-1 flex-col px-4 pt-4">
          <div className="relative min-h-0 flex-1">
            <FitText
              text={g.label}
              className="display text-center text-[var(--on-accent)]"
            />
          </div>
          {g.sub ? (
            <p className="pb-1 text-center text-sm font-bold text-[var(--on-accent)] opacity-70">
              {g.sub}
            </p>
          ) : null}
        </div>
        {/* The only control on screen — nothing to mis-tap while the phone is handled. */}
        <div className="p-4">
          <BrutalButton variant="paper" size="xl" onClick={g.generate}>
            Generate
          </BrutalButton>
        </div>
      </main>
    );
  }

  if (g.phase === "countdown") {
    return (
      <main
        className="flex min-h-dvh items-center justify-center"
        style={{ background: accent }}
      >
        <span
          key={g.count}
          className="display animate-punch text-[40vw] leading-none text-[var(--on-accent)]"
        >
          {g.count}
        </span>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-dvh flex-col"
      style={{ ["--accent-flood" as string]: accent }}
    >
      <TopBar back="/who-am-i" title="Who Am I?" right={<MuteToggle />} />

      <div className="flex-1 space-y-4 px-4 pb-4">
        <div
          className="brutal flex items-center gap-3 p-4 text-[var(--on-accent)]"
          style={{ background: accent }}
        >
          <span className="text-3xl" aria-hidden>
            {meta.emoji}
          </span>
          <div>
            <h1 className="display text-2xl">{meta.label}</h1>
            <p className="text-xs font-bold opacity-70">
              Guess your {meta.noun}
            </p>
          </div>
        </div>

        <HowToPlay noun={meta.noun} />

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

        <p className="text-center text-xs font-bold uppercase tracking-wide opacity-60">
          Everyone needs their own phone
        </p>
      </div>

      <div className="sticky bottom-0 space-y-3 bg-[var(--paper)] p-4 pt-3 shadow-[0_-3px_0_0_var(--ink)]">
        <BrutalButton variant="accent" size="xl" onClick={g.generate}>
          Generate
        </BrutalButton>
        <p className="text-center text-xs font-bold opacity-60">
          3 seconds to get it on your forehead ·{" "}
          <Link href="/scoreboard" className="underline decoration-2">
            Keeping score?
          </Link>
        </p>
      </div>
    </main>
  );
}
