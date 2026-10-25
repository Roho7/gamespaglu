"use client";

import { HostOrJoinScreen } from "@/components/room/host-or-join-screen";
import { TiktikiRoomScreen } from "@/components/tiktiki/tiktiki-room-screen";
import { ScoreTable, TiktikiRules } from "@/components/tiktiki/tiktiki-rules";
import { useRoom, type RoomHandle } from "@/lib/hooks/use-room";

export function TiktikiApp() {
  return <TiktikiScreens room={useRoom("tiktiki")} />;
}

export function TiktikiScreens({ room }: { room: RoomHandle<"tiktiki"> }) {
  if (!room.state) {
    return (
      <HostOrJoinScreen
        title="Tiktiki"
        palette="neon"
        rules={<TiktikiRules />}
        aside={{ title: "Scoring", body: <ScoreTable /> }}
        onCreate={(name) => void room.create(name)}
        onJoin={room.join}
        busy={room.status === "connecting"}
        error={room.error}
      />
    );
  }
  return <TiktikiRoomScreen state={room.state} room={room} reconnecting={room.status === "connecting"} />;
}
