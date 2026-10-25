"use client";

import { useState } from "react";
import { FitText } from "@/components/ui/fit-text";
import { DeckSettings } from "@/components/generator/deck-settings";
import { HowToPlay } from "@/components/generator/how-to-play";
import { RotatePhoneHint } from "@/components/generator/rotate-phone-hint";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { BriefingPanes } from "@/components/stitch/briefing-panes";
import { BackLink } from "@/components/layout/page-corners";
import { CATEGORIES } from "@/lib/deck/categories";
import { paletteById, theme } from "@/lib/palettes";
import { useGenerator } from "@/lib/hooks/use-generator";
import { useWakeLock } from "@/lib/hooks/use-wake-lock";
import type { CategoryId } from "@/lib/deck/types";

/**
 * The play screen. Before a round it is the briefing: how to play and
 * settings, one tab at a time. During a round it is one
 * word on a field of colour, with the photo dithered in behind it at the
 * reveal. Every draw reprints the screen in a fresh palette.
 *
 * mode="game" adds the 3-second countdown, the window to get the phone onto a
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

  heading: string;
  about?: React.ReactNode;
}) {
  const meta = CATEGORIES[category];
  const isGame = mode === "game";
  const g = useGenerator(category, { countdown: isGame });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const briefing = g.phase === "idle" || settingsOpen;
  const canGoBack = settingsOpen && g.phase === "reveal";
  const nothingToDraw = g.hydrated && g.poolSize === 0;

  useWakeLock(isGame && g.phase !== "idle");

  const generate = () => {
    setSettingsOpen(false);
    g.generate();
  };
  const openSettings = () => {
    if (g.phase === "countdown") g.reset();
    else setSettingsOpen(true);
  };

  const palette = g.palette ?? paletteById(meta.palette);

  return (
    <div {...theme(palette)} className="mb-stage flex h-dvh flex-col">
      <div className="mb-label mb-label-bleed flex-1">
        <div className="mb-label-field relative flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">{heading}</h1>

          {!briefing && g.phase === "reveal" && g.image ? (
            <DitheredPhoto
              key={g.image.src}
              image={g.image.src}
              palette={palette}
              className="absolute inset-0 opacity-40"
            />
          ) : null}

          {briefing ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 p-1">
              <BackLink className="-ml-[var(--rule-thin)]" />
              <BriefingPanes
                initial={settingsOpen ? "settings" : "rules"}
                panes={[
                  {
                    id: "rules",
                    title: "How to play",
                    body: <HowToPlay category={category} isGame={isGame} about={about} />,
                  },
                  {
                    id: "settings",
                    title: "Settings",
                    body: <DeckSettings category={category} generator={g} />,
                  },
                ]}
              />
            </div>
          ) : (
            <div className="relative min-h-0 flex-1">
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
                    <RotatePhoneHint />
                  </div>
                </>
              ) : g.label ? (
                <div className="animate-stamp absolute inset-0">
                  <FitText text={g.label} className="mb-display text-center" />
                </div>
              ) : null}
            </div>
          )}

          {!briefing && g.sub && g.phase === "reveal" ? (
            <p className="mb-caps relative pb-1 text-center text-[0.65rem] opacity-70">
              {g.sub}
            </p>
          ) : null}
          {!briefing && g.phase === "reveal" && g.image ? (
            <a
              href={g.image.credit}
              target="_blank"
              rel="noreferrer"
              className="mb-caps relative pb-2 text-center text-sm opacity-60"
            >
              Photo · Wikimedia Commons
            </a>
          ) : null}
        </div>

        {nothingToDraw ? (
          <p className="bg-[var(--cw-shadow)] px-4 py-2 text-center text-xs font-semibold text-[var(--cw-base)]">
            Nothing matches those settings. Turn something back on.
          </p>
        ) : null}
        <div className="flex">
          <button
            type="button"
            onClick={generate}
            disabled={nothingToDraw}
            className="mb-band-action flex-[3] py-10"
          >
            <StitchBorder className="inset-3" />
            <span className="mb-display-sm text-4xl">
              {g.phase === "idle" ? "Generate" : "Regenerate"}
            </span>
          </button>
          {briefing && !canGoBack ? null : (
            <button
              type="button"
              onClick={canGoBack ? () => setSettingsOpen(false) : openSettings}
              className="mb-band-action flex-[2] py-10"
            >
              <StitchBorder className="inset-3" />
              <span className="mb-display-sm text-4xl">
                {canGoBack ? "Back" : "Settings"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
