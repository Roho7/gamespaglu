"use client";

import { useState } from "react";
import { AppBar } from "@/components/app-bar";
import { Panel } from "@/components/mb/ui";
import { useOnline } from "@/lib/use-online";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH, type Err } from "@shared/protocol";

/**
 * Getting in. Deliberately NOT a play surface — it is a form, and pretending
 * otherwise would be the mistake rule 1 warns about: two different kinds of
 * thing must not look the same. So it sits on plain kraft with no colourway,
 * no band and no label, and the game's own treatment starts once you are in a
 * room.
 */
export function JoinScreen({
  onCreate,
  onJoin,
  busy,
  error,
}: {
  onCreate: (name: string) => void;
  onJoin: (name: string, code: string) => void;
  busy: boolean;
  error: Err | null;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const online = useOnline();
  const named = name.trim().length > 0;
  const blocked = !online || busy;

  return (
    <main className="min-h-dvh px-4 pt-20 pb-10">
      <AppBar back="/" title="Girgit" titleHidden />

      <div className="mx-auto w-full max-w-sm space-y-5">
        <div className="mb-tilt text-center">
          <p className="mb-display mb-shadow text-5xl">Girgit</p>
          <p className="mb-caps mt-2 text-[0.6rem] opacity-70">
            Everyone gets the word. One of you doesn&apos;t.
          </p>
        </div>

        {/* Girgit is the one thing on this site that needs a connection.
            Everything else works with no signal, so saying so plainly beats a
            button that silently does nothing. */}
        {!online ? (
          <Panel className="space-y-1">
            <p className="text-sm font-bold">No signal.</p>
            <p className="text-[0.75rem] opacity-75">
              Girgit needs a connection — it is the only game here that does.
              The generators and the scoreboard still work offline.
            </p>
          </Panel>
        ) : error ? (
          <Panel className="text-sm font-bold">{error.message}</Panel>
        ) : null}

        <label className="block space-y-1.5">
          <span className="mb-caps text-[0.6rem] opacity-60">Your name</span>
          <Input
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            autoComplete="off"
          />
        </label>

        <Button
          size="hero"
          onClick={() => onCreate(name)}
          disabled={!named || blocked}
        >
          Start a room
        </Button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-current opacity-20" />
          <span className="mb-caps text-[0.55rem] opacity-50">or join one</span>
          <span className="h-px flex-1 bg-current opacity-20" />
        </div>

        <div className="flex items-end gap-2">
          <label className="flex-1 space-y-1.5">
            <span className="mb-caps text-[0.6rem] opacity-60">Room code</span>
            <Input
              value={code}
              maxLength={ROOM_CODE_LENGTH}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              className="text-center text-xl font-extrabold tracking-[0.3em]"
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => onJoin(name, code)}
            disabled={!named || code.length !== ROOM_CODE_LENGTH || blocked}
          >
            Join
          </Button>
        </div>
      </div>
    </main>
  );
}
