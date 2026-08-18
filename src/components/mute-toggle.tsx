"use client";

import { blip, MUTE_KEY } from "@/lib/feedback";
import { usePersisted } from "@/lib/use-persisted";

/** Sound defaults on — the countdown drama is the point. Lives in Settings. */
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
      className="press flex items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-bold text-[var(--ink)]"
    >
      <span aria-hidden>{muted ? "\u{1F507}" : "\u{1F50A}"}</span>
      {muted ? "Muted" : "Sound on"}
    </button>
  );
}
