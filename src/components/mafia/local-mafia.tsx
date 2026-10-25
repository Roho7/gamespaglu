"use client";

import dynamic from "next/dynamic";

/** Behind a NODE_ENV check so production bundles never carry the room service or the bots. */
export const LocalMafia =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/mafia/local-mafia-app"), { ssr: false })
    : () => null;
