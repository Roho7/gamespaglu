"use client";

import dynamic from "next/dynamic";

/**
 * Behind a NODE_ENV check so production bundles never carry the grids, which
 * otherwise stay on the server.
 */
export const LocalGirgit =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/girgit/local-girgit-app"), { ssr: false })
    : () => null;
