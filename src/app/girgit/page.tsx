"use client";

import { JoinScreen } from "@/components/girgit/join-screen";
import { RoomScreen } from "@/components/girgit/room-screen";
import { useRoom } from "@/lib/girgit/use-room";

export default function GirgitPage() {
  const { state, status, error, create, join, leave, act } = useRoom();

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
