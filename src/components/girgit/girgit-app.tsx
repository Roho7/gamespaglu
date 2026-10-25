"use client";

import { GirgitHostSettings, GirgitRules } from "@/components/girgit/room-panels";
import { RoomScreen } from "@/components/girgit/room-screen";
import { HostOrJoinScreen } from "@/components/room/host-or-join-screen";
import { usePersisted } from "@/lib/hooks/use-persisted";
import { useRoom, type RoomHandle } from "@/lib/hooks/use-room";
import { DEFAULT_GIRGIT_SETTINGS, type GirgitSettings } from "@shared/protocol";

export function GirgitApp() {
  return <GirgitScreens room={useRoom("girgit")} />;
}

export function GirgitScreens({ room }: { room: RoomHandle<"girgit"> }) {
  const [prefs, setPrefs] = usePersisted<GirgitSettings>("girgit:host-prefs", DEFAULT_GIRGIT_SETTINGS);

  if (!room.state) {
    return (
      <HostOrJoinScreen
        title="Girgit"
        palette="jungle"
        rules={<GirgitRules />}
        aside={{ title: "Settings", body: <GirgitHostSettings prefs={prefs} onChange={setPrefs} /> }}
        onCreate={(name) => void room.create(name, prefs)}
        onJoin={room.join}
        busy={room.status === "connecting"}
        error={room.error}
      />
    );
  }

  return <RoomScreen state={room.state} room={room} reconnecting={room.status === "connecting"} />;
}
