"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BackLink } from "@/components/layout/page-corners";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOnline } from "@/lib/hooks/use-online";
import { paletteById, theme, type PaletteId } from "@/lib/palettes";
import { MAX_NAME_LENGTH, ROOM_CODE_LENGTH, type Err } from "@shared/protocol";

type Door = "host" | "join";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="relative block space-y-1.5">
      <span className="mb-caps text-sm">{label}</span>
      {children}
    </label>
  );
}

/**
 * A room game's front door: a briefing in stitched panels, then Host or Join in the band. Each opens
 * a dialog asking only for what that door needs, and the room screen takes over once the server
 * seats you. Under a disabled button, a line names what is missing.
 */
export function HostOrJoinScreen({
  title,
  palette: paletteId,
  rules,
  aside,
  onCreate,
  onJoin,
  busy,
  error,
}: {
  title: string;
  palette: PaletteId;
  rules: React.ReactNode;
  /** The second panel: a game's settings, or what the table will be dealt. */
  aside: { title: string; body: React.ReactNode };
  onCreate: (name: string) => void;
  onJoin?: (name: string, code: string) => void;
  busy: boolean;
  error: Err | null;
}) {
  const palette = paletteById(paletteId);
  const [door, setDoor] = useState<Door | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
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
    if (door === "host") onCreate(name);
    else onJoin?.(name, code);
  };

  return (
    <main {...theme(palette)} className="flex h-dvh flex-col">
      <div className="mb-label mb-label-bleed flex-1">
        <PaletteGrain palette={palette} tone="ink" className="absolute inset-0" />
        <div
          {...theme(palette, { flipped: true })}
          className="mb-label-field relative flex min-h-0 flex-1 flex-col"
        >
          <h1 className="sr-only">{title}</h1>
          <div className="flex min-h-0 flex-1 flex-col gap-2 p-1">
            <BackLink className="ml-1" />
            {online ? null : (
              <p className="relative bg-[var(--cw-primary)] px-4 py-3 text-sm font-semibold">
                <StitchBorder variant="field" className="inset-0" />
                No signal. Room games need a connection; the generators and the scoreboard
                still work offline.
              </p>
            )}
            <StitchedPanel title="How to play" className="flex-[3] basis-0">
              {rules}
            </StitchedPanel>
            <StitchedPanel title={aside.title} className="flex-[2] basis-0">
              {aside.body}
            </StitchedPanel>
          </div>
        </div>
        <div className="relative flex">
          {(onJoin ? (["host", "join"] as const) : (["host"] as const)).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDoor(d)}
              className="mb-band-action flex-1 py-10"
            >
              <StitchBorder className="inset-3" />
              <span className="mb-display-sm text-4xl">{d === "host" ? "Host" : "Join"}</span>
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
        <DialogContent {...theme(palette)}>
          <DialogHeader>
            <DialogTitle>{door === "join" ? "Join a room" : "Host a room"}</DialogTitle>
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
              {missing ? <p className="mb-caps text-sm">{missing}</p> : null}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
