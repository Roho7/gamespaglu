"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { BackLink } from "@/components/layout/page-corners";
import { BriefingPanes } from "@/components/stitch/briefing-panes";
import { Chip } from "@/components/ui/controls";
import { WAVELENGTH_MODES } from "@/content/guides";
import { MODES, ROUND_OPTIONS, type Mode } from "@/lib/wavelength/engine";
import { cn } from "@/lib/utils";

const LINK = "mb-caps underline decoration-2 underline-offset-4";

function times(n: number) {
  if (n === 1) return "once";
  if (n === 2) return "twice";
  return `${n} times`;
}

function roundsLine(mode: Mode, rounds: number) {
  const lead = `${rounds} ${rounds === 1 ? "round" : "rounds"}:`;
  switch (mode) {
    case "psychic":
      return `${lead} everyone is the Psychic ${times(rounds)}.`;
    case "guesser":
      return `${lead} everyone is the guesser ${times(rounds)}.`;
    case "teams":
      return `${lead} each team plays ${rounds} ${rounds === 1 ? "card" : "cards"}.`;
  }
}

/** The mode switch, drawn as tabs: picking a tab picks the mode and shows its rules. */
function ModeTabs({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <div role="tablist" aria-label="Mode" className="grid grid-cols-3 gap-2">
      {MODES.map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="tab"
            id={`mode-tab-${m}`}
            aria-selected={active}
            aria-controls="mode-rules"
            onClick={() => onMode(m)}
            className={cn(
              "relative flex flex-col items-center gap-1 border-[length:var(--rule-thin)] border-[var(--cw-shadow)] px-1 pt-2.5 pb-2 text-center transition-transform active:translate-y-[1px]",
              active ? "text-[var(--cw-base)]" : "text-[var(--cw-shadow)]",
            )}
          >
            {active ? (
              <motion.span
                layoutId="wavelength-mode-tab"
                aria-hidden
                className="absolute -inset-[2px] bg-[var(--cw-shadow)] shadow-[3px_3px_0_var(--cw-highlight)]"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", duration: 0.35, bounce: 0.25 }
                }
              />
            ) : null}
            <span className="mb-display-sm relative text-[1.05em] leading-none">
              {WAVELENGTH_MODES[m].name}
            </span>
            <span className="mb-caps relative text-[0.48em] opacity-80">
              {WAVELENGTH_MODES[m].players}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The opening screen: mode rules on one tab, the round count on the other. */
export function WavelengthBriefing({
  mode,
  rounds,
  onMode,
  onRounds,
}: {
  mode: Mode;
  rounds: number;
  onMode: (m: Mode) => void;
  onRounds: (r: number) => void;
}) {
  const rules = WAVELENGTH_MODES[mode];
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-1">
      <BackLink className="-ml-[var(--rule-thin)]" />
      <BriefingPanes
        panes={[
          {
            id: "rules",
            title: "How to play",
            body: (
              <>
                <ModeTabs mode={mode} onMode={onMode} />
                <motion.ol
                  key={mode}
                  id="mode-rules"
                  role="tabpanel"
                  aria-labelledby={`mode-tab-${mode}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-[1em] flex flex-col gap-[0.65em] font-medium"
                >
                  {rules.steps.map((step, i) => (
                    <li key={step} className="flex gap-2">
                      <span className="mb-display-sm text-accent w-[1.1em] shrink-0 text-[1.15em] leading-none">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </motion.ol>
                <nav className="mt-4">
                  <Link href="/how-to-play/wavelength" className={LINK}>
                    Full rules
                  </Link>
                </nav>
              </>
            ),
          },
          {
            id: "rounds",
            title: "Rounds",
            body: (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ROUND_OPTIONS.map((r) => (
                    <Chip key={r} active={r === rounds} onClick={() => onRounds(r)}>
                      {r}
                    </Chip>
                  ))}
                </div>
                <p className="font-medium opacity-80">
                  {roundsLine(mode, rounds)} Next, add the players to the scoreboard.
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
