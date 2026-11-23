"use client";

import { HostOrJoinScreen } from "@/components/room/host-or-join-screen";
import { SecretHitlerRoomScreen } from "@/components/secret-hitler/secret-hitler-room-screen";
import { SecretHitlerRules, ShRoleTable } from "@/components/secret-hitler/secret-hitler-rules";
import { useHydrated } from "@/lib/hooks/use-persisted";
import { useRoom } from "@/lib/hooks/use-room";
import { isRoomCode, normaliseCode } from "@shared/protocol";

function inviteCode(): string | null {
  const code = normaliseCode(new URLSearchParams(window.location.search).get("code") ?? "");
  return isRoomCode(code) ? code : null;
}

export function SecretHitlerApp() {
  const room = useRoom("secret-hitler");
  const hydrated = useHydrated();
  if (!room.state) {
    return (
      <HostOrJoinScreen
        title="Secret Hitler"
        palette="pulp"
        rules={<SecretHitlerRules />}
        aside={{ title: "Who's who", body: <ShRoleTable /> }}
        onCreate={(name) => void room.create(name)}
        onJoin={room.join}
        busy={room.status === "connecting"}
        error={room.error}
        invite={hydrated ? inviteCode() : null}
      />
    );
  }
  return (
    <SecretHitlerRoomScreen state={room.state} room={room} reconnecting={room.status === "connecting"} />
  );
}
