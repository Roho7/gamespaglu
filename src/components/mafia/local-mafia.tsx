"use client";

import dynamic from "next/dynamic";

export const LocalMafia =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/mafia/local-mafia-app"), { ssr: false })
    : () => null;
