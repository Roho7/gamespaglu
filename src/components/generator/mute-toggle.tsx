"use client";

import { blip, MUTE_KEY } from "@/lib/sound-and-haptics";
import { usePersisted } from "@/lib/hooks/use-persisted";
import { Chip } from "@/components/ui/controls";

/** Sound defaults on: the countdown drama is the point. */
export function MuteToggle() {
  const [muted, setMutedPref] = usePersisted<boolean>(MUTE_KEY, false);

  return (
    <Chip
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      active={!muted}
      onClick={() => {
        setMutedPref(!muted);
        if (muted) blip();
      }}
    >
      {muted ? "Sound off" : "Sound on"}
    </Chip>
  );
}
