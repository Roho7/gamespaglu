"use client";

import { tiktikiBrain } from "@server/tiktiki/bot";
import { TiktikiScreens } from "@/components/tiktiki/tiktiki-app";
import { useLocalRoom } from "@/lib/hooks/use-local-room";

const BOTS = { brain: tiktikiBrain, names: ["Asha", "Bunty", "Chiku", "Dolly"] } as const;

/** Tiktiki against bots, entirely in the browser. Development only. */
export default function LocalTiktikiApp() {
  return <TiktikiScreens room={useLocalRoom("tiktiki", BOTS)} />;
}
