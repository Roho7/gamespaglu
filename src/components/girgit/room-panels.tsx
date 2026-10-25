"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Chip } from "@/components/ui/controls";
import { CLUE_SECONDS_OPTIONS, PACKS, type GirgitSettings } from "@shared/protocol";

/** Girgit's rules in six lines, with the full guide one tap away. */
export function GirgitRules() {
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ol className="flex flex-col gap-[0.65em] font-medium">
        <li>1. Everyone sees the same 16 words and the theme.</li>
        <li>
          2. Everyone can see which word is the secret one — except the Girgit,
          who only knows they are the Girgit.
        </li>
        <li>
          3. Hold the button to check your word. Don&apos;t let your neighbour
          see it.
        </li>
        <li>
          4. Everyone writes one clue. They land on the table as they come.
        </li>
        <li>5. Argue. Out loud. Then vote.</li>
        <li>
          6. Catch the Girgit and they get one guess at the word to escape.
        </li>
      </ol>
      <Link
        href="/how-to-play/girgit"
        className="block font-bold underline decoration-2"
      >
        Full rules{" "}
        <ArrowRight
          className="inline size-[1em] align-[-0.125em]"
          strokeWidth={3}
          aria-hidden
        />
      </Link>
    </div>
  );
}

/** The settings a host's room starts with. Joining someone else's room, theirs apply. */
export function GirgitHostSettings({
  prefs,
  onChange,
}: {
  prefs: GirgitSettings;
  onChange: (next: GirgitSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="mb-caps text-[0.72em]">Word packs</p>
        <div className="flex flex-wrap gap-2">
          {PACKS.map((pk) => {
            const on = prefs.packs.includes(pk.id);
            const next = on ? prefs.packs.filter((p) => p !== pk.id) : [...prefs.packs, pk.id];
            return (
              <Chip
                key={pk.id}
                active={on}
                disabled={next.length === 0}
                onClick={() => onChange({ ...prefs, packs: next })}
              >
                {pk.label}
              </Chip>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <p className="mb-caps text-[0.72em]">Clue timer</p>
        <div className="flex flex-wrap gap-2">
          {CLUE_SECONDS_OPTIONS.map((n) => (
            <Chip
              key={n}
              active={prefs.clueSeconds === n}
              onClick={() => onChange({ ...prefs, clueSeconds: n })}
            >
              {n}s
            </Chip>
          ))}
        </div>
      </div>
      <p className="opacity-80">
        Used when you host. Joining someone else&apos;s room, theirs apply.
      </p>
    </div>
  );
}
