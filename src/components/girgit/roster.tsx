"use client";

import { cn } from "@/lib/utils";
import type { PublicPlayer } from "@shared/protocol";

/**
 * Who the table is still waiting on.
 *
 * WHO has acted is public; WHAT they said is not — knowing a name is in leaks
 * nothing and is the single thing real players asked for first. Without it a
 * phase that is waiting on one locked phone is indistinguishable from a phase
 * that is broken.
 */
export function Roster({
  players,
  doneIds,
  youId,
  skippedIds = [],
}: {
  players: PublicPlayer[];
  doneIds: string[];
  youId: string;
  skippedIds?: string[];
}) {
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {players.map((p) => {
        const done = doneIds.includes(p.id);
        const skipped = skippedIds.includes(p.id);
        return (
          <li
            key={p.id}
            className={cn(
              "rounded-full border-[length:var(--rule-thin)] px-2.5 py-1 text-[0.7rem] font-bold",
              done
                ? "border-[color:var(--frame)] bg-[var(--frame)] text-[var(--shadow-text,var(--shadow-ink))]"
                : "border-current opacity-55",
              skipped && "line-through opacity-40",
              // Away is not gone — it explains the wait without ending anyone's game.
              !p.connected && !done && "italic",
            )}
          >
            {p.name}
            {p.id === youId ? " (you)" : ""}
            {!p.connected && !done ? " · away" : ""}
          </li>
        );
      })}
    </ul>
  );
}
