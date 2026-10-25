"use client";

import { useState } from "react";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { ROLE_LABEL } from "@/components/mafia/mafia-rules";
import type { MafiaYourRound } from "@shared/protocol";

const BRIEF = {
  mafia: "Kill one player each night. Your team must agree, or nobody dies.",
  doctor: "Save one player each night, yourself included. Never the same player two nights running.",
  detective: "Check one other player each night. The answer comes at morning.",
  villager: "No power. Your night pick is a hunch, and it shows in the replay.",
} as const;

function Secrets({ your, nameOf }: { your: MafiaYourRound; nameOf: (id: string) => string }) {
  switch (your.role) {
    case "mafia":
      return (
        <div className="space-y-2">
          <p className="text-sm font-bold">
            {your.team.length ? `With you: ${your.team.map(nameOf).join(", ")}` : "You work alone."}
          </p>
          {your.teamPicks.length ? (
            <ul className="space-y-1 text-sm">
              {your.teamPicks.map((p) => (
                <li key={p.playerId}>
                  {nameOf(p.playerId)} wants {p.targetId ? nameOf(p.targetId) : "…"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    case "detective":
      return your.checks.length ? (
        <ul className="space-y-1 text-sm font-bold">
          {your.checks.map((c) => (
            <li key={c.night}>
              Night {c.night}: {nameOf(c.targetId)} is {c.isMafia ? "Mafia" : "not Mafia"}
            </li>
          ))}
        </ul>
      ) : null;
    case "doctor":
      return your.lastSave ? (
        <p className="text-sm font-bold">Last night you saved {nameOf(your.lastSave)}. Not them tonight.</p>
      ) : null;
    case "villager":
      return null;
  }
}

/**
 * Press and hold to see your role. Every player has the same button and the card opens in the same
 * fixed frame whatever is on it, so a neighbour watching learns nothing from its size or shape.
 */
export function YourCard({ your, nameOf }: { your: MafiaYourRound; nameOf: (id: string) => string }) {
  const [held, setHeld] = useState(false);
  const release = () => setHeld(false);

  return (
    <>
      <button
        type="button"
        className="mb-btn mb-btn-tertiary w-full px-6 py-2.5 text-base select-none"
        onPointerDown={() => setHeld(true)}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        {held ? "Let go" : "Hold for your card"}
      </button>
      {held ? (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 top-20 z-30 flex h-72 flex-col gap-3 bg-[var(--ground)] p-6 text-[var(--ground-ink)]"
        >
          <StitchBorder className="inset-2" />
          <p className="mb-caps text-[0.6rem] opacity-70">{your.alive ? "You are" : "You were"}</p>
          <p className="mb-display text-5xl">{ROLE_LABEL[your.role]}</p>
          <p className="text-sm">{BRIEF[your.role]}</p>
          <Secrets your={your} nameOf={nameOf} />
        </div>
      ) : null}
    </>
  );
}
