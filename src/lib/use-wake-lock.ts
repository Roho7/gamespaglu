"use client";

import { useEffect } from "react";

type Sentinel = { release: () => Promise<void>; released: boolean };
type WakeLockNav = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<Sentinel> };
};

/**
 * A phone sitting on a forehead receives no touches, so the screen dims and
 * locks mid-round. Hold it awake while a word is showing, and re-acquire when
 * the tab becomes visible again (the lock is dropped automatically on hide).
 * Unsupported browsers simply no-op.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as WakeLockNav;
    if (!nav.wakeLock) return;

    let sentinel: Sentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const s = await nav.wakeLock!.request("screen");
        if (cancelled) {
          void s.release();
          return;
        }
        sentinel = s;
      } catch {
        /* denied or unsupported — nothing to do */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (sentinel && !sentinel.released) void sentinel.release();
    };
  }, [active]);
}
