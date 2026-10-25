"use client";

import { girgitBrain } from "@server/girgit/bot";
import { GirgitScreens } from "@/components/girgit/girgit-app";
import { useLocalRoom } from "@/lib/hooks/use-local-room";

const BOTS = { brain: girgitBrain, names: ["Asha", "Bunty", "Chiku", "Dolly"] } as const;

/** Girgit against bots, entirely in the browser. Development only. */
export default function LocalGirgitApp() {
  return <GirgitScreens room={useLocalRoom("girgit", BOTS)} />;
}
