"use client";

import { blip, MUTE_KEY } from "@/lib/feedback";
import { usePersisted } from "@/lib/use-persisted";

/** Always visible, always remembered. Sound defaults on — the drama is the point. */
export function MuteToggle() {
  const [muted, setMutedPref] = usePersisted<boolean>(MUTE_KEY, false);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      aria-pressed={muted}
      onClick={() => {
        setMutedPref(!muted);
        if (muted) blip();
      }}
      className="press brutal-sm bg-[var(--paper)] px-3 py-1.5 text-lg"
    >
      {muted ? "\u{1F507}" : "\u{1F50A}"}
    </button>
  );
}
