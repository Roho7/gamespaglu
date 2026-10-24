"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Girgit's rules in six lines, with the full guide one tap away. */
export function GirgitRules() {
  return (
    <div className="space-y-3">
      <ol className="space-y-3 text-sm font-medium">
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
        className="block text-sm font-bold underline decoration-2"
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
