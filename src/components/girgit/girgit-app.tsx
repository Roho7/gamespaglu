"use client";

import { HostOrJoinScreen } from "@/components/girgit/host-or-join-screen";
import { RoomScreen } from "@/components/girgit/room-screen";
import { useGirgitRoom } from "@/lib/hooks/use-girgit-room";
import { ALL_PACKS, DEFAULT_CLUE_SECONDS } from "@shared/protocol";

export function GirgitApp() {
  const { state, status, error, create, join, leave, act } = useGirgitRoom();

  if (!state) {
    return (
      <HostOrJoinScreen
        onCreate={async (name, prefs) => {
          const r = await create(name);
          if (!r.ok) return;
          if (prefs.packs.length !== ALL_PACKS.length)
            await act.setPacks(prefs.packs);
          if (prefs.clueSeconds !== DEFAULT_CLUE_SECONDS)
            await act.setClueSeconds(prefs.clueSeconds);
        }}
        onJoin={join}
        busy={status === "connecting"}
        error={error}
      />
    );
  }

  return (
    <RoomScreen
      state={state}
      act={act}
      leave={leave}
      reconnecting={status === "connecting"}
    />
  );
}
