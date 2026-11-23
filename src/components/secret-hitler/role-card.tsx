"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eye } from "lucide-react";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { POLICY_LABEL, ROLE_BRIEF, ROLE_LABEL, ROLE_PAST } from "@/content/secret-hitler-copy";
import { theme } from "@/lib/palettes";
import { cn } from "@/lib/utils";
import type { ShYourRound } from "@shared/protocol";

const ROLE_PALETTE = { liberal: "cobalt", fascist: "cherry", hitler: "cherry" } as const;

function Knowledge({ your, nameOf }: { your: ShYourRound; nameOf: (id: string) => string }) {
  const team = your.knows.filter((k) => k.role === "fascist").map((k) => nameOf(k.playerId));
  const hitler = your.knows.find((k) => k.role === "hitler");
  return (
    <div className="space-y-1 font-bold">
      {your.role === "fascist" ? (
        <>
          {hitler ? <p>Hitler is {nameOf(hitler.playerId)}.</p> : null}
          {team.length ? <p>Your fellow Fascists: {team.join(", ")}.</p> : null}
        </>
      ) : null}
      {your.role === "hitler" ? (
        <p>{team.length ? `Your Fascist: ${team.join(", ")}.` : "You don't know who your Fascists are. They know you."}</p>
      ) : null}
      {your.investigations.map((i) => (
        <p key={i.playerId}>
          You checked {nameOf(i.playerId)}: {POLICY_LABEL[i.party]} party.
        </p>
      ))}
    </div>
  );
}

/**
 * Press and hold to see your Secret Role and what your night showed you. The card opens in the same
 * frame whatever is on it, so a neighbour watching learns nothing from its size.
 */
export function RoleCard({
  your,
  nameOf,
  className,
}: {
  your: ShYourRound;
  nameOf: (id: string) => string;
  className?: string;
}) {
  const [held, setHeld] = useState(false);
  const still = useReducedMotion();
  const release = () => setHeld(false);

  return (
    <>
      <button
        type="button"
        aria-label="Hold to peek at your card"
        className={cn("mb-btn mb-btn-tertiary w-full touch-none px-6 py-2.5 text-base select-none", className)}
        onPointerDown={(e) => {
          setHeld(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Eye className="inline size-[1em] align-[-0.125em]" strokeWidth={2.5} aria-hidden />{" "}
        {held ? "Let go" : "Hold to see your role"}
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
              {...theme(ROLE_PALETTE[your.role])}
              className="mb-label aspect-[5/7] w-[min(20rem,82vw)] p-2.5"
              initial={still ? { opacity: 0 } : { opacity: 0, rotateY: -110, x: 160, scale: 0.8 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={still ? { opacity: 0 } : { opacity: 0, rotateY: 80, x: 160, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <div
                {...theme(ROLE_PALETTE[your.role])}
                className="mb-label-field relative m-0 flex h-full flex-col overflow-hidden"
              >
                <div className="relative flex min-h-0 flex-1 flex-col gap-2 px-6 pt-6 pb-8 text-sm leading-snug">
                  <StitchBorder className="inset-1.5" />
                  <p className="mb-caps mt-2 text-xs opacity-80">Your secret role</p>
                  <p className="mb-display mb-shadow text-6xl leading-none">{ROLE_LABEL[your.role]}</p>
                  <p className="mb-caps text-xs">
                    Party: {POLICY_LABEL[your.role === "liberal" ? "liberal" : "fascist"]}
                  </p>
                  <p>{your.alive ? ROLE_BRIEF[your.role] : ROLE_PAST[your.role]}</p>
                  <Knowledge your={your} nameOf={nameOf} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
