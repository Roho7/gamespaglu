"use client";

import dynamic from "next/dynamic";

export const LocalTiktiki =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@/components/tiktiki/local-tiktiki-app"), { ssr: false })
    : () => null;
