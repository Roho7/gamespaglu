"use client";

import { MafiaRoomScreen } from "@/components/mafia/mafia-room-screen";
import { MafiaRules, RoleTable } from "@/components/mafia/mafia-rules";
import { HostOrJoinScreen } from "@/components/room/host-or-join-screen";
import { useRoom, type RoomHandle } from "@/lib/hooks/use-room";

export function MafiaApp() {
  return <MafiaScreens room={useRoom("mafia")} />;
}

export function MafiaScreens({ room }: { room: RoomHandle<"mafia"> }) {
  if (!room.state) {
    return (
      <HostOrJoinScreen
        title="Mafia"
        palette="cherry"
        rules={<MafiaRules />}
        aside={{ title: "Who's who", body: <RoleTable /> }}
        onCreate={(name) => void room.create(name)}
        onJoin={room.join}
        busy={room.status === "connecting"}
        error={room.error}
      />
    );
  }
  return <MafiaRoomScreen state={room.state} room={room} reconnecting={room.status === "connecting"} />;
}
