"use client";

import { GirgitScreens } from "@/components/girgit/girgit-app";
import { useLocalGirgitRoom } from "@/lib/hooks/use-local-girgit-room";

/** Girgit against bots, entirely in the browser. Development only. */
export default function LocalGirgitApp() {
  return <GirgitScreens room={useLocalGirgitRoom()} />;
}
