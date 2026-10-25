import { Crown } from "lucide-react";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { PALETTES, theme } from "@/lib/palettes";
import type { PublicPlayer } from "@shared/protocol";

/**
 * A room's running totals, as the server keeps them, so every phone at the table shows the same
 * rows. Read-only: points come from the game, never a thumb.
 */
export function RoomScoreboard({ players }: { players: PublicPlayer[] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.seat - b.seat);
  const leader = sorted[0]?.score ?? 0;
  return (
    <ul className="space-y-3">
      {sorted.map((p) => {
        const rank = sorted.findIndex((q) => q.score === p.score) + 1;
        const leading = leader > 0 && p.score === leader;
        return (
          <li
            key={p.id}
            {...theme(PALETTES[p.seat % PALETTES.length])}
            className="mb-label relative flex flex-row items-center gap-3 px-5 py-4"
          >
            <StitchBorder className="inset-1.5" />
            <span className="mb-caps relative w-8 shrink-0 text-sm opacity-70">#{rank}</span>
            <div className="relative min-w-0 flex-1">
              <p className="mb-display-sm truncate text-2xl">{p.name}</p>
              {leading ? (
                <p className="mb-caps flex items-center gap-1.5 text-sm">
                  <Crown className="size-3.5" strokeWidth={2.5} aria-hidden />
                  Leading
                </p>
              ) : null}
            </div>
            <span className={`mb-display relative text-5xl leading-none tabular-nums ${leading ? "mb-shadow" : ""}`}>
              {p.score}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
