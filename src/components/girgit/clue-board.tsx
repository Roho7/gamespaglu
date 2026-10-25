"use client";

import { cn } from "@/lib/utils";

/** One player's slip on the board. */
export type ClueSlip = {
  id: string;
  name: string;
  /** Null until they have written one. */
  clue: string | null;
  you?: boolean;
  away?: boolean;
  /** A caps line under the clue: "timed out", "voted", "Girgit". */
  note?: string;
  /** A tag in the corner: votes received, or points won at the reveal. */
  badge?: string | null;
  /** The Girgit, once revealed. */
  marked?: boolean;
  dim?: boolean;
};

/**
 * The clues, one slip per player, two to a row so ten players still fit
 * under the grid. Every player has a slip from the deal, so you can always see
 * who is still writing.
 *
 * Slips are outlined in the field's rule ink, unlike the filled word tiles, so
 * a clue never reads as one of the sixteen words. During the vote they become
 * tap targets and take the loud rule and hard shadow every tappable thing on
 * the play surface has.
 */
export function ClueBoard({
  slips,
  onSelect,
  disabledIds = [],
}: {
  slips: ClueSlip[];
  /** When present, slips become tap targets. */
  onSelect?: (playerId: string) => void;
  disabledIds?: string[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {slips.map((s) => {
        const selectable = Boolean(onSelect) && !disabledIds.includes(s.id);
        const Slip = selectable ? "button" : "div";
        return (
          <li key={s.id} className={cn("flex", s.dim && "opacity-45")}>
            <Slip
              {...(selectable
                ? { type: "button" as const, onClick: () => onSelect?.(s.id) }
                : {})}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2.5 py-2 text-left",
                "border-[length:var(--rule-thin)]",
                s.marked
                  ? "border-[color:var(--loud)] bg-[var(--loud)] text-[var(--on-loud)]"
                  : s.clue
                    ? "border-[color:var(--cw-secondary)]"
                    : "border-dashed border-[color:var(--cw-secondary)]",
                selectable &&
                "border-[color:var(--loud)] shadow-[3px_3px_0_var(--loud)] transition-transform active:translate-[3px] active:shadow-none",
              )}
            >
              <span className="mb-caps flex max-w-full items-baseline gap-1.5 pr-8 text-[0.55rem]">
                <span className="truncate">{s.name}</span>
                {s.you ? <span className="opacity-60">you</span> : null}
                {s.away ? <span className="opacity-60">away</span> : null}
              </span>
              <span
                className={cn(
                  "mb-display-sm block max-w-full truncate text-2xl leading-none",
                  !s.clue && "opacity-40",
                )}
              >
                {s.clue ?? "…"}
              </span>
              {s.note ? (
                <span className="mb-caps text-sm opacity-70">
                  {s.note}
                </span>
              ) : null}
              {s.badge ? (
                <span
                  className={cn(
                    "mb-display-sm absolute top-1.5 right-1.5 flex h-7 min-w-7 items-center justify-center px-1 text-lg tabular-nums",
                    s.marked
                      ? "bg-[var(--on-loud)] text-[var(--loud)]"
                      : "bg-[var(--loud)] text-[var(--on-loud)]",
                  )}
                >
                  {s.badge}
                </span>
              ) : null}
            </Slip>
          </li>
        );
      })}
    </ul>
  );
}
