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
      className="mb-btn mb-btn-secondary px-4 py-1.5 text-xs"
    >
      <span aria-hidden>{muted ? "\u{1F507}" : "\u{1F50A}"}</span>
      {muted ? "Muted" : "Sound on"}
    </button>
  );
}
