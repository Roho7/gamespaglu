"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { notePopState, recordPath } from "@/lib/history-depth";

/** Feeds every route change into `history-depth`, so `BackLink` knows if back stays in the app. */
export function HistoryDepthMemory() {
  const pathname = usePathname();

  useEffect(() => {
    window.addEventListener("popstate", notePopState);
    return () => window.removeEventListener("popstate", notePopState);
  }, []);

  useEffect(() => {
    recordPath(pathname);
  }, [pathname]);

  return null;
}
