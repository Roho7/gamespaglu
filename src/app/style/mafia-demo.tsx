"use client";

import { useState } from "react";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { YourCard } from "@/components/mafia/your-card";
import type { MafiaYourRound } from "@shared/protocol";

const NAMES: Record<string, string> = { you: "Roho", asha: "Asha", bunty: "Bunty", chiku: "Chiku" };
const nameOf = (id: string) => NAMES[id] ?? "Someone";

/** The night as every living player sees it: the same seats, one of them chosen. */
export function NightSeatsDemo({ slips }: { slips: SeatSlip[] }) {
  const [chosen, setChosen] = useState("asha");
  return <SeatBoard slips={slips.map((s) => ({ ...s, selected: s.id === chosen }))} onSelect={setChosen} />;
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
  return <YourCard your={your} nameOf={nameOf} />;
}
