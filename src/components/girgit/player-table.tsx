"use client";

import { cn } from "@/lib/utils";
import type { PublicPlayer } from "@shared/protocol";

/**
 * The table in the middle of the table.
 *
 * Every player has a row from the moment the round deals, so the board is a
 * fixed shape that fills in — you can always see who is missing, which is what
 * a wall of appearing-and-disappearing cards could never show.
 *
 * It sits on kraft rather than on the field, on purpose. The play surface is one
 * flat colour by design, and a single raised paper surface is what gives the
 * screen a hierarchy without introducing a second accent.
 */
export function PlayerTable({
  players,
  youId,
  rowsRight,
  onSelect,
  selectedId,
  disabledIds = [],
  dimIds = [],
}: {
  players: PublicPlayer[];
  youId: string;
  /** What sits on the right of each row: a clue, a vote count, a placeholder. */
  rowsRight: (p: PublicPlayer) => React.ReactNode;
  /** When present, rows become tap targets. */
  onSelect?: (playerId: string) => void;
  selectedId?: string | null;
  disabledIds?: string[];
  dimIds?: string[];
}) {
  return (
    <ul
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)]",
        "border-[length:var(--rule)] border-[color:var(--frame)]",
        "bg-[var(--ground-soft)] text-[var(--ground-ink)]",
        "shadow-[0_5px_0_0_var(--shadow-ink)]",
      )}
    >
      {players.map((p, i) => {
        const selectable = Boolean(onSelect) && !disabledIds.includes(p.id);
        const Row = selectable ? "button" : "div";
        return (
          <li
            key={p.id}
            className={cn(
              i > 0 && "border-t-[length:var(--rule-thin)] border-current/15",
              dimIds.includes(p.id) && "opacity-45",
            )}
          >
            <Row
              {...(selectable
                ? { type: "button" as const, onClick: () => onSelect?.(p.id) }
                : {})}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left",
                selectable && "active:translate-y-[1px]",
                selectedId === p.id && "bg-[var(--highlight)]",
              )}
            >
              <span className="flex items-baseline gap-1.5 text-sm font-extrabold">
                {p.name}
                {p.id === youId ? (
                  <span className="mb-caps text-[0.5rem] opacity-60">you</span>
                ) : null}
                {/* Away, never gone — it explains a blank row without ending
                    anybody's game. */}
                {!p.connected ? (
                  <span className="mb-caps text-[0.5rem] opacity-50">away</span>
                ) : null}
              </span>
              <span className="min-w-0 text-right">{rowsRight(p)}</span>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}
