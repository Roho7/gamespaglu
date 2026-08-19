"use client";

import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { BrutalButton } from "@/components/brutal";
import { FitText } from "@/components/fit-text";
import { MuteToggle } from "@/components/mute-toggle";
import { SideDrawer } from "@/components/game/settings-drawer";
import { RangePicker, RegionPicker } from "@/components/game/filters";
import { CATEGORIES } from "@/lib/categories";
import { availableCountries, availableLanguages } from "@/lib/entries";
import { clampRange } from "@/lib/draw";
import { useGenerator } from "@/lib/use-generator";
import { useWakeLock } from "@/lib/use-wake-lock";
import type { CategoryId } from "@/lib/types";

/**
 * The whole product, on one screen: a wall of the category's colour, a huge
 * Generate, and nothing else. Settings and rules are drawers.
 *
 * mode="game" adds the 3-second countdown, which is the window to get the
 * phone onto your forehead. mode="tool" reveals instantly, for the standalone
 * generator routes.
 */
export function GeneratorScreen({
  category,
  mode,
  heading,
  about,
}: {
  category: CategoryId;
  mode: "game" | "tool";
  /** The page's h1. Small on screen, but present for crawlers and screen readers. */
  heading: string;
  about?: React.ReactNode;
}) {
  const meta = CATEGORIES[category];
  const isGame = mode === "game";
  const g = useGenerator(category, { countdown: isGame });

  // A phone on a forehead receives no touches. Hold the screen awake from the
  // countdown onward so it never sleeps mid-round.
  useWakeLock(isGame && g.phase !== "idle");

  // Category colour until the first draw; a fresh pastel on every draw after.
  const accent = g.accent ?? `var(${meta.accentVar})`;

  return (
    <main
      className="flex min-h-dvh flex-col text-[var(--on-accent)] transition-colors duration-300 motion-reduce:transition-none"
      style={{ ["--accent-flood" as string]: accent, background: accent }}
    >
      <AppBar
        back="/"
        title={<h1 className="display text-base leading-tight">{heading}</h1>}
        extra={
          <>
            <SideDrawer
              label="How to play"
              icon="?"
              title={isGame ? "How to play" : "About"}
            >
              {isGame ? (
                <ol className="space-y-3 text-sm font-medium">
                  <li>1. Everyone needs their own phone, open on this screen.</li>
                  <li>
                    2. Hit Generate. You get three seconds — put the phone on
                    your forehead, screen facing out.
                  </li>
                  <li>
                    3. Everyone else can see your {meta.noun}. You can&apos;t.
                    Ask yes-or-no questions until you get it.
                  </li>
                  <li>4. Got it? Hit Generate again for the next one.</li>
                </ol>
              ) : null}
              {about}
              <Link
                href="/how-to-play/who-am-i"
                className="block text-sm font-bold underline decoration-2"
              >
                Full rules and variations →
              </Link>
            </SideDrawer>

            <SideDrawer label="Settings" icon="⚙" title="Settings">
              {g.hydrated && meta.hasRegionFilter ? (
                <div className="space-y-3">
                  <p className="caps text-[0.65rem] opacity-55">Where from</p>
                  <RegionPicker
                    countries={g.prefs.countries}
                    languages={g.prefs.languages}
                    onCountries={(countries) => g.savePrefs({ countries })}
                    onLanguages={(languages) => g.savePrefs({ languages })}
                    poolSize={g.poolSize}
                    showLanguages={meta.hasLanguageFilter}
                    availableCountries={availableCountries(
                      category as Exclude<typeof category, "number">,
                    )}
                    availableLanguages={availableLanguages(
                      category as Exclude<typeof category, "number">,
                    )}
                  />
                </div>
              ) : null}

              {g.hydrated && meta.hasRangeFilter ? (
                <div className="space-y-3">
                  <p className="caps text-[0.65rem] opacity-55">Range</p>
                  <RangePicker
                    min={g.prefs.min}
                    max={g.prefs.max}
                    onChange={(min, max) => {
                      const [lo, hi] = clampRange(min, max);
                      g.savePrefs({ min: lo, max: hi });
                    }}
                  />
                </div>
              ) : null}

              {!meta.hasRegionFilter && !meta.hasRangeFilter ? (
                <p className="text-sm font-medium opacity-70">
                  Nothing to configure here — the {meta.noun} list is one
                  curated deck, and nothing repeats until it runs out.
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t-2 border-[var(--line)] pt-4">
                <span className="caps text-[0.65rem] opacity-55">Sound</span>
                <MuteToggle />
              </div>

              <Link
                href="/"
                className="block text-sm font-bold underline decoration-2"
              >
                All categories →
              </Link>
            </SideDrawer>
          </>
        }
      />

      {/* The stage. Empty, counting down, or holding a word — never a form. */}
      <div className="relative min-h-0 flex-1 px-4">
        {g.phase === "countdown" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              key={g.count}
              className="display animate-punch text-[38vw] leading-none"
            >
              {g.count}
            </span>
          </div>
        ) : g.label ? (
          <div className="animate-slam absolute inset-0">
            <FitText text={g.label} className="display text-center" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-6xl" aria-hidden>
              {meta.emoji}
            </span>
            <p className="display text-3xl opacity-40">
              {isGame ? `Guess your ${meta.noun}` : `Random ${meta.noun}`}
            </p>
          </div>
        )}
      </div>

      {g.sub && g.phase === "reveal" ? (
        <p className="pb-1 text-center text-sm font-bold opacity-60">{g.sub}</p>
      ) : null}

      <div className="flex flex-col items-center gap-2 px-4 pb-7">
        {g.hydrated && g.poolSize === 0 ? (
          <p className="text-center text-sm font-semibold opacity-70">
            Nothing matches those filters. Open ⚙ and turn something back on.
          </p>
        ) : null}
        <BrutalButton
          variant="paper"
          size="lg"
          onClick={g.generate}
          disabled={g.hydrated && g.poolSize === 0}
          className="w-full max-w-xs text-2xl"
        >
          Generate
        </BrutalButton>
      </div>
    </main>
  );
}
