"use client";

import { useState } from "react";
import { AppBar } from "@/components/app-bar";
import { Panel } from "@/components/mb/ui";
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
  const named = name.trim().length > 0;

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

        {error ? (
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
          disabled={!named || busy}
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
            disabled={!named || code.length !== ROOM_CODE_LENGTH || busy}
          >
            Join
          </Button>
        </div>
      </div>
    </main>
  );
}
