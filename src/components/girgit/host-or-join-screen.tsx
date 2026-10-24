"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { GirgitRules } from "@/components/girgit/room-panels";
import { BackLink } from "@/components/layout/page-corners";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOnline } from "@/lib/hooks/use-online";
import { usePersisted } from "@/lib/hooks/use-persisted";
import { paletteById, theme } from "@/lib/palettes";
import {
  ALL_PACKS,
  CLUE_SECONDS_OPTIONS,
  DEFAULT_CLUE_SECONDS,
  MAX_NAME_LENGTH,
  PACKS,
  ROOM_CODE_LENGTH,
  type ClueSeconds,
  type Err,
  type PackId,
} from "@shared/protocol";

const GIRGIT = paletteById("jungle");

/** What a host's room starts with; applied the moment the room exists. */
export type HostPrefs = { packs: PackId[]; clueSeconds: ClueSeconds };

const DEFAULT_PREFS: HostPrefs = {
  packs: ALL_PACKS,
  clueSeconds: DEFAULT_CLUE_SECONDS,
};

type Door = "host" | "join";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block space-y-1.5">
      <span className="mb-caps text-[0.6rem]">{label}</span>
      {children}
    </label>
  );
}

/**
 * Girgit's front door, a briefing like every other game's on the jungle
 * grain: how to play, and the settings a host's room starts with, then Host
 * or Join in the band. Each opens a dialog that asks only for what that door
 * needs, and the room screen takes over once the server seats you. Under a
 * disabled button, a line names what is missing.
 */
export function HostOrJoinScreen({
  onCreate,
  onJoin,
  busy,
  error,
}: {
  onCreate: (name: string, prefs: HostPrefs) => void;
  onJoin: (name: string, code: string) => void;
  busy: boolean;
  error: Err | null;
}) {
  const [door, setDoor] = useState<Door | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [prefs, setPrefs] = usePersisted<HostPrefs>(
    "girgit:host-prefs",
    DEFAULT_PREFS,
  );
  const online = useOnline();

  useEffect(() => {
    if (error) toast(error.message);
  }, [error]);

  const missing = !online
    ? "No signal"
    : busy
      ? door === "host"
        ? "Starting…"
        : "Joining…"
      : door === "join" && code.length !== ROOM_CODE_LENGTH
        ? `Enter the ${ROOM_CODE_LENGTH}-letter code`
        : !name.trim()
          ? "Type your name first"
          : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (missing) return;
    if (door === "host") onCreate(name, prefs);
    else onJoin(name, code);
  };

  return (
    <main {...theme(GIRGIT)} className="flex h-dvh flex-col">
      <div className="mb-label mb-label-bleed flex-1">
        <PaletteGrain
          palette={GIRGIT}
          tone="ink"
          className="absolute inset-0"
        />
        <div
          {...theme(GIRGIT, { flipped: true })}
          className="mb-label-field relative flex min-h-0 flex-1 flex-col"
        >
          <h1 className="sr-only">Girgit</h1>
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-1">
            <BackLink className="ml-1" />
            {online ? null : (
              <p className="relative bg-[var(--cw-primary)] px-4 py-3 text-sm font-semibold">
                <StitchBorder variant="field" className="inset-0" />
                No signal. Girgit is the one game here that needs a connection;
                the generators and the scoreboard still work offline.
              </p>
            )}
            <StitchedPanel title="How to play" className="flex-[3] basis-0">
              <GirgitRules />
            </StitchedPanel>
            <StitchedPanel title="Settings" className="flex-[2] basis-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="mb-caps text-[0.6rem]">Word packs</p>
                  <div className="flex flex-wrap gap-2">
                    {PACKS.map((pk) => {
                      const on = prefs.packs.includes(pk.id);
                      const next = on
                        ? prefs.packs.filter((p) => p !== pk.id)
                        : [...prefs.packs, pk.id];
                      return (
                        <Chip
                          key={pk.id}
                          active={on}
                          disabled={next.length === 0}
                          onClick={() => setPrefs({ ...prefs, packs: next })}
                        >
                          {pk.label}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="mb-caps text-[0.6rem]">Clue timer</p>
                  <div className="flex flex-wrap gap-2">
                    {CLUE_SECONDS_OPTIONS.map((n) => (
                      <Chip
                        key={n}
                        active={prefs.clueSeconds === n}
                        onClick={() => setPrefs({ ...prefs, clueSeconds: n })}
                      >
                        {n}s
                      </Chip>
                    ))}
                  </div>
                </div>
                <p className="text-[0.7rem] opacity-80">
                  Used when you host. Joining someone else&apos;s room, theirs
                  apply.
                </p>
              </div>
            </StitchedPanel>
          </div>
        </div>
        <div className="relative flex">
          {(["host", "join"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDoor(d)}
              className="mb-band-action flex-1 py-10"
            >
              <StitchBorder className="inset-3" />
              <span className="mb-display-sm text-4xl">
                {d === "host" ? "Host" : "Join"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Dialog
        open={door !== null}
        onOpenChange={(open) => {
          if (!open) setDoor(null);
        }}
      >
        <DialogContent {...theme(GIRGIT)}>
          <DialogHeader>
            <DialogTitle>
              {door === "join" ? "Join a room" : "Host a room"}
            </DialogTitle>
            <DialogDescription>
              {door === "join"
                ? "Ask the host for the code on their screen."
                : "You get a code to read out to the table."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="relative space-y-4">
            {door === "join" ? (
              <Field label="Room code">
                <Input
                  value={code}
                  maxLength={ROOM_CODE_LENGTH}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  className="text-center text-2xl font-extrabold tracking-[0.3em]"
                />
              </Field>
            ) : null}
            <Field label="Your name, for the table">
              <Input
                value={name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                autoComplete="off"
              />
            </Field>
            <div className="space-y-2 text-center">
              <Button type="submit" size="hero" disabled={missing !== null}>
                {door === "join" ? "Join" : "Start a room"}
              </Button>
              {missing ? (
                <p className="mb-caps text-[0.6rem]">{missing}</p>
              ) : null}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
