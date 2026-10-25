"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eye } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import { ROLE_LABEL } from "@/components/mafia/mafia-rules";
import { RoleEmblem } from "@/components/mafia/role-emblem";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { HOW_TO_PICK, ROLE_BRIEF } from "@/content/mafia-copy";
import { ROLE_ART } from "@/content/role-art";
import { useImageReady } from "@/lib/hooks/use-image-ready";
import { theme, type Palette } from "@/lib/palettes";
import { cn } from "@/lib/utils";
import type { MafiaYourRound } from "@shared/protocol";

type Props = { your: MafiaYourRound; nameOf: (id: string) => string; palette: Palette };

function Secrets({ your, nameOf }: Omit<Props, "palette">) {
  switch (your.role) {
    case "mafia":
      return (
        <div className="space-y-1">
          <p className="font-bold">
            {your.team.length ? `Your crew: ${your.team.map(nameOf).join(", ")}` : "Lone wolf. No crew, no witnesses."}
          </p>
          {your.teamPicks.map(({ playerId, targetId }) => (
            <p key={playerId}>
              {!targetId
                ? `${nameOf(playerId)} hasn't picked yet.`
                : targetId === your.pick
                  ? `You and ${nameOf(playerId)} both want ${nameOf(targetId)} gone. Done deal.`
                  : `${nameOf(playerId)} wants ${nameOf(targetId)} gone.`}
            </p>
          ))}
        </div>
      );
    case "detective":
      return (
        <div className="space-y-1 font-bold">
          {your.checks.map((c) => (
            <p key={c.night}>
              Night {c.night}: {nameOf(c.targetId)} {c.isMafia ? "is Mafia. Gotcha." : "is clean."}
            </p>
          ))}
        </div>
      );
    case "doctor":
      return your.lastSave ? (
        <p className="font-bold">Last night you patched up {nameOf(your.lastSave)}. Spread the love tonight.</p>
      ) : null;
    case "villager":
      return null;
  }
}

function CardArt({ your, palette }: Omit<Props, "nameOf">) {
  const art = ROLE_ART[your.role];
  const ready = useImageReady(art);
  return (
    <div className="relative h-[36%] shrink-0 overflow-hidden border-b-[length:var(--rule-thin)] border-[color:var(--cw-secondary)]">
      {ready ? (
        <DitheredPhoto image={art} palette={palette} className="absolute inset-0" />
      ) : (
        <>
          <PaletteGrain palette={palette} tone="field" className="absolute inset-0" />
          <RoleEmblem role={your.role} className="absolute inset-0 m-auto size-32" />
        </>
      )}
    </div>
  );
}



export function YourCard({
  your,
  nameOf,
  palette,
  night,
  className,
}: Props & { night: boolean; className?: string }) {
  const [held, setHeld] = useState(false);
  const still = useReducedMotion();
  const release = () => setHeld(false);
  const label = ROLE_LABEL[your.role];

  return (
    <>
      <button
        type="button"
        aria-label="Hold to peek at your card"
        className={cn(
          "relative flex h-40 w-12 touch-none flex-col items-center justify-center gap-2 bg-[var(--loud)] text-[var(--on-loud)] shadow-[-4px_4px_0_var(--shadow-ink)] transition-transform select-none active:-translate-x-1",
          className,
        )}
        onPointerDown={(e) => {
          setHeld(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span aria-hidden className="absolute inset-1.5 border border-dashed border-current opacity-70" />
        <Eye className="size-5" strokeWidth={2.5} aria-hidden />
        <span className="mb-caps rotate-180 text-[0.6rem] [writing-mode:vertical-rl]">
          {held ? "Let go" : "Your card"}
        </span>
      </button>

      <AnimatePresence>
        {held ? (
          <motion.div
            key="card"
            aria-live="polite"
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-[color-mix(in_srgb,var(--ground)_80%,transparent)] [perspective:1000px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              className="mb-label aspect-[5/7] w-[min(20rem,82vw)] p-2.5"
              initial={still ? { opacity: 0 } : { opacity: 0, rotateY: -110, x: 160, scale: 0.8 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={still ? { opacity: 0 } : { opacity: 0, rotateY: 80, x: 160, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <div
                {...theme(palette, { flipped: true })}
                className="mb-label-field relative m-0 flex h-full flex-col overflow-hidden"
              >
                <CardArt your={your} palette={palette} />
                <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 px-6 pt-5 pb-9 text-[0.8rem] leading-snug">
                  <StitchBorder className="inset-1.5" />
                  <p className="mb-caps text-[0.55rem] opacity-70">{your.alive ? "Your card" : "Your old card"}</p>
                  <p className="mb-display mb-shadow -mt-1 text-4xl leading-none">{label}</p>
                  <p>{your.alive ? ROLE_BRIEF[your.role] : "You're a ghost now. Ghosts watch. Ghosts don't talk."}</p>
                  <Secrets your={your} nameOf={nameOf} />
                  {night && your.alive ? (
                    <p className="mb-caps mt-auto text-[0.6rem] text-[var(--loud)]">{HOW_TO_PICK}</p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
