"use client";

import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { FitText } from "@/components/fit-text";
import { MuteToggle } from "@/components/mute-toggle";
import { SideDrawer } from "@/components/game/settings-drawer";
import {
  EraPicker,
  RangePicker,
  RegionPicker,
  SpicyToggle,
  TypePicker,
} from "@/components/game/filters";
import { Sticker } from "@/components/mb/sticker";
import { Marquee } from "@/components/mb/marquee";
import { RotateHint } from "@/components/mb/rotate-hint";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { colourwayById, colourwayVars } from "@/lib/colourways";
import { clampRange } from "@/lib/draw";
import { availableCountries, availableTypes, hasSpicy } from "@/lib/entries";
import { useGenerator } from "@/lib/use-generator";
import { useWakeLock } from "@/lib/use-wake-lock";
import type { CategoryId } from "@/lib/types";

/**
 * The play screen IS a matchbox label: frame, field, marquee, hero, and a black
 * band holding Generate. One accent per screen, and every draw reprints the
 * label in a fresh colourway.
 *
 * mode="game" adds the 3-second countdown — the window to get the phone onto a
 * forehead. mode="tool" reveals instantly for the standalone generator routes.
 */
export function GeneratorScreen({
  category,
  mode,
  heading,
  about,
}: {
  category: CategoryId;
  mode: "game" | "tool";
  /** The page's h1. Small on screen, but present for crawlers and readers. */
  heading: string;
  about?: React.ReactNode;
}) {
  const meta = CATEGORIES[category];
  const isGame = mode === "game";
  const g = useGenerator(category, { countdown: isGame });

  // A phone on a forehead receives no touches; hold the screen awake from the
  // countdown onward so it never sleeps mid-round.
  useWakeLock(isGame && g.phase !== "idle");

  // Category colourway until the first draw, then a fresh one each time.
  const colourway = g.colourway ?? colourwayById(meta.colourway);

  return (
    <div
      style={colourwayVars(colourway)}
      className="flex min-h-dvh flex-col"
    >
      <div className="mb-label mb-label-bleed flex-1">
        <div className="mb-label-field relative flex min-h-0 flex-1 flex-col">
          <AppBar
            back="/"
            titleHidden
            title={heading}
            extra={
              <>
                <SideDrawer
                  label="How to play"
                  icon="?"
                  title={isGame ? "How to play" : "About"}
                >
                  {isGame ? (
                    <ol className="space-y-3 text-sm font-medium">
                      <li>
                        1. Everyone needs their own phone, open on this screen.
                      </li>
                      <li>
                        2. Hit Generate. You get three seconds — turn the phone
                        sideways and put it on your forehead, screen facing out.
                      </li>
                      <li>
                        3. Everyone else can see your {meta.noun}. You
                        can&apos;t. Ask yes-or-no questions until you get it.
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
                  {g.hydrated && meta.hasTypeFilter ? (
                    <div className="space-y-3">
                      <p className="mb-caps text-[0.6rem] opacity-60">
                        Who counts
                      </p>
                      <TypePicker
                        types={g.prefs.types}
                        onTypes={(types) => g.savePrefs({ types })}
                        available={availableTypes(category, {
                          countries: g.prefs.countries,
                          era: g.prefs.era,
                          spicy: g.prefs.spicy,
                        })}
                      />
                    </div>
                  ) : null}

                  {g.hydrated && meta.hasTypeFilter ? (
                    <div className="space-y-3">
                      <p className="mb-caps text-[0.6rem] opacity-60">Era</p>
                      <EraPicker
                        era={g.prefs.era}
                        onEra={(era) => g.savePrefs({ era })}
                      />
                    </div>
                  ) : null}

                  {g.hydrated && meta.hasRegionFilter ? (
                    <div className="space-y-3">
                      <p className="mb-caps text-[0.6rem] opacity-60">
                        Where from
                      </p>
                      <RegionPicker
                        countries={g.prefs.countries}
                        onCountries={(countries) => g.savePrefs({ countries })}
                        poolSize={g.poolSize}
                        availableCountries={availableCountries(category)}
                      />
                    </div>
                  ) : null}

                  {g.hydrated && hasSpicy(category) ? (
                    <div className="space-y-3">
                      <p className="mb-caps text-[0.6rem] opacity-60">Spicy</p>
                      <SpicyToggle
                        spicy={g.prefs.spicy}
                        onSpicy={(spicy) => g.savePrefs({ spicy })}
                      />
                    </div>
                  ) : null}

                  {g.hydrated && meta.hasRangeFilter ? (
                    <div className="space-y-3">
                      <p className="mb-caps text-[0.6rem] opacity-60">Range</p>
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
                    <p className="text-sm font-medium opacity-75">
                      Nothing to configure here — the {meta.noun} list is one
                      curated deck, and nothing repeats until it runs out.
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 border-t-[var(--rule-thin)] border-current pt-4">
                    <span className="mb-caps text-[0.6rem] opacity-60">
                      Sound
                    </span>
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

          {/* The stage: sticker, countdown, or the drawn word. One marquee.
              pt clears the floating pill. */}
          <div className="relative min-h-0 flex-1 pt-14">
            {g.phase === "countdown" ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    key={g.count}
                    className="mb-display animate-punch text-[30vh] leading-none"
                  >
                    {g.count}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
                  <RotateHint />
                </div>
              </>
            ) : g.label ? (
              <div className="animate-stamp absolute inset-0">
                <FitText text={g.label} className="mb-display text-center" />
              </div>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* The one marquee on this screen, and only ever behind
                      artwork — never behind type. */}
                  <div className="relative flex h-[min(74vw,38vh)] w-[min(74vw,38vh)] items-center justify-center">
                    <Marquee className="absolute inset-0 text-[var(--highlight)]" />
                    <Sticker
                      category={category}
                      className="relative z-10 h-3/5 w-3/5"
                    />
                  </div>
                </div>
                <p className="mb-caps absolute inset-x-0 bottom-3 z-10 text-center text-[0.7rem]">
                  {isGame ? `Guess my ${meta.noun}` : `Random ${meta.noun}`}
                </p>
              </>
            )}
          </div>

          {g.sub && g.phase === "reveal" ? (
            <p className="mb-caps pb-1 text-center text-[0.65rem] opacity-70">
              {g.sub}
            </p>
          ) : null}
        </div>

        {/* The black band, as on the reference label. */}
        <div className="mb-band flex-col gap-1.5 px-4 py-3">
          {g.hydrated && g.poolSize === 0 ? (
            <p className="text-center text-xs font-semibold">
              Nothing matches those filters. Open ⚙ and turn something back on.
            </p>
          ) : null}
          <Button
            size="hero"
            onClick={g.generate}
            disabled={g.hydrated && g.poolSize === 0}
            className="max-w-sm"
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
