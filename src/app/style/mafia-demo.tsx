"use client";

import { useCallback, useState } from "react";
import { PhaseCurtain } from "@/components/mafia/phase-curtain";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { YourCard } from "@/components/mafia/your-card";
import { Button } from "@/components/ui/button";
import { mafiaBeats, type Beat } from "@/content/mafia-copy";
import { paletteById } from "@/lib/palettes";
import type { MafiaYourRound } from "@shared/protocol";

const NAMES: Record<string, string> = { you: "Roho", asha: "Asha", bunty: "Bunty", chiku: "Chiku" };
const nameOf = (id: string) => NAMES[id] ?? "Someone";

/** The night as every living player sees it: the same seats, one of them chosen. */
export function NightSeatsDemo({ slips }: { slips: SeatSlip[] }) {
  const [chosen, setChosen] = useState("asha");
  return (
    <SeatBoard
      slips={slips.map((s) => ({ ...s, selected: s.id === chosen }))}
      palette={paletteById("cobalt")}
      onSelect={setChosen}
    />
  );
}

const BASE: MafiaYourRound = {
  role: "villager",
  alive: true,
  team: [],
  teamPicks: [],
  pick: null,
  vote: null,
  checks: [],
  lastSave: null,
};

/** The card for two different roles: the same button, the same frame. */
export function YourCardDemo({ role }: { role: "mafia" | "detective" }) {
  const your: MafiaYourRound =
    role === "mafia"
      ? { ...BASE, role, team: ["bunty"], teamPicks: [{ playerId: "bunty", targetId: "asha" }] }
      : { ...BASE, role, checks: [{ night: 1, targetId: "chiku", isMafia: false }] };
  return <YourCard your={your} nameOf={nameOf} palette={paletteById("cobalt")} night />;
}

const CURTAINS: { palette: "cobalt" | "cherry"; beat: (seed: string) => Beat }[] = [
  { palette: "cobalt", beat: mafiaBeats.night },
  { palette: "cherry", beat: (seed) => mafiaBeats.morning(seed, { name: "Bunty", role: "detective" }) },
  { palette: "cherry", beat: mafiaBeats.vote },
  { palette: "cherry", beat: (seed) => mafiaBeats.verdict(seed, { name: "Asha", role: "mafia" }) },
  { palette: "cherry", beat: (seed) => mafiaBeats.over(seed, "town") },
];

/** Raises each beat's curtain in turn, with a fresh seed every time, so the line changes. */
export function CurtainDemo() {
  const [shown, setShown] = useState<{ n: number; seed: string } | null>(null);
  const [count, setCount] = useState(0);
  const lift = useCallback(() => setShown(null), []);
  const pick = shown ? CURTAINS[shown.n % CURTAINS.length] : null;
  return (
    <>
      <Button
        onClick={() => {
          setShown({ n: count, seed: `demo:${count}` });
          setCount(count + 1);
        }}
      >
        Raise the next curtain
      </Button>
      <PhaseCurtain
        beat={shown && pick ? { ...pick.beat(shown.seed), id: shown.seed } : null}
        palette={paletteById(pick?.palette ?? "cobalt")}
        onDone={lift}
      />
    </>
  );
}
