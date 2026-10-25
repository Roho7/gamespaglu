"use client";

import { mafiaBrain } from "@server/mafia/bot";
import { MafiaScreens } from "@/components/mafia/mafia-app";
import { useLocalRoom } from "@/lib/hooks/use-local-room";

const BOTS = { brain: mafiaBrain, names: ["Asha", "Bunty", "Chiku", "Dolly", "Ekta", "Faiz"] } as const;

/** Mafia against bots, entirely in the browser. Development only. */
export default function LocalMafiaApp() {
  return <MafiaScreens room={useLocalRoom("mafia", BOTS)} />;
}
