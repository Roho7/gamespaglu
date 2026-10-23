"use client";

import { JoinScreen } from "@/components/girgit/join-screen";
import { RoomScreen } from "@/components/girgit/room-screen";
import { useGirgitRoom } from "@/lib/hooks/use-girgit-room";

export function GirgitApp() {
  const { state, status, error, create, join, leave, act } = useGirgitRoom();

  if (!state) {
    return (
      <JoinScreen
        onCreate={create}
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
