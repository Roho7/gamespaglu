"use client";

import { useState } from "react";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoom } from "@/lib/girgit/use-room";
import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH } from "@shared/protocol";

/**
 * M1 lobby — deliberately unstyled.
 *
 * This screen exists to prove the room layer works: join by code, presence,
 * and silent resume after a reload. The matchbox treatment lands in M4, and
 * building it now would mean redesigning against a game that does not exist.
 */
export default function GirgitPage() {
  const { state, status, error, create, join, leave, kick } = useRoom();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const you = state?.players.find((p) => p.id === state.you);

  return (
    <main className="min-h-dvh p-4 pb-28">
      <AppBar />
      <h1 className="mb-display-sm mt-4">Girgit</h1>
      <p className="mb-caps text-[0.65rem] opacity-60">
        M1 — rooms only, no game yet
      </p>

      {error ? (
        <p className="mt-4 text-sm font-bold">
          {error.message} <span className="opacity-50">({error.code})</span>
        </p>
      ) : null}

      {!state ? (
        <div className="mt-6 space-y-4">
          <label className="block space-y-1">
            <span className="mb-caps text-[0.6rem] opacity-60">Your name</span>
            <Input
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
          </label>

          <Button onClick={() => create(name)} disabled={!name.trim()}>
            Start a room
          </Button>

          <div className="flex items-end gap-2">
            <label className="flex-1 space-y-1">
              <span className="mb-caps text-[0.6rem] opacity-60">Room code</span>
              <Input
                value={code}
                maxLength={ROOM_CODE_LENGTH}
                autoCapitalize="characters"
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD"
              />
            </label>
            <Button
              onClick={() => join(name, code)}
              disabled={!name.trim() || code.length !== ROOM_CODE_LENGTH}
            >
              Join
            </Button>
          </div>

          {status === "connecting" ? <p className="text-sm">Connecting…</p> : null}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="mb-display-sm">{state.code}</p>
          <p className="mb-caps text-[0.6rem] opacity-60">
            {state.players.length} of {state.maxPlayers} · need {state.minPlayers} to
            play
            {status === "connecting" ? " · reconnecting…" : ""}
          </p>

          <ul className="space-y-1">
            {state.players.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className={p.connected ? "" : "opacity-40"}>
                  {p.name}
                  {p.id === state.you ? " (you)" : ""}
                  {p.isHost ? " · host" : ""}
                  {/* Away, not gone. A locked phone must not read as departure. */}
                  {p.connected ? "" : " · away"}
                </span>
                {you?.isHost && p.id !== state.you ? (
                  <button
                    className="mb-caps text-[0.55rem] underline opacity-60"
                    onClick={() => kick(p.id)}
                  >
                    remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <Button onClick={leave}>Leave</Button>
        </div>
      )}
    </main>
  );
}
