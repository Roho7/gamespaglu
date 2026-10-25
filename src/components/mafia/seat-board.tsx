"use client";

import { cn } from "@/lib/utils";

/** One player's seat at the table. */
export type SeatSlip = {
  id: string;
  name: string;
  you?: boolean;
  away?: boolean;
  out?: boolean;
  /** A caps line under the name: a revealed role, how they went, "voted". */
  note?: string;
  /** A tag in the corner: votes received, or points won. */
  badge?: string | null;
  selected?: boolean;
  /** Tappable right now. */
  open?: boolean;
  /** Not a player: the vote for nobody. Full width and dashed, so it never reads as a seat. */
  abstain?: boolean;
};

/**
 * The table, one seat per player, two to a row so twelve still fit. Names are the display line,
 * so a seat never reads as a Girgit clue. Only open seats take the loud rule and hard shadow;
 * the one you have chosen fills loud.
 */
export function SeatBoard({
  slips,
  onSelect,
}: {
  slips: SeatSlip[];
  onSelect?: (id: string) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {slips.map((s) => {
        const tappable = Boolean(onSelect && s.open);
        const Seat = tappable ? "button" : "div";
        return (
          <li key={s.id} className={cn("flex", s.out && "opacity-50", s.abstain && "col-span-2")}>
            <Seat
              {...(tappable ? { type: "button" as const, onClick: () => onSelect?.(s.id) } : {})}
              aria-pressed={tappable ? Boolean(s.selected) : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2.5 py-2 text-left",
                "border-[length:var(--rule-thin)] border-[color:var(--cw-secondary)]",
                s.abstain && "items-center border-dashed",
                tappable &&
                  "border-[color:var(--loud)] shadow-[3px_3px_0_var(--loud)] transition-transform active:translate-[3px] active:shadow-none",
                s.selected && "border-[color:var(--loud)] bg-[var(--loud)] text-[var(--on-loud)]",
              )}
            >
              <span
                className={cn(
                  "mb-display-sm block max-w-full truncate pr-8 text-2xl leading-none",
                  s.out && "line-through decoration-2",
                )}
              >
                {s.name}
              </span>
              <span className="mb-caps flex max-w-full items-baseline gap-1.5 text-[0.5rem]">
                {s.you ? <span className="opacity-70">you</span> : null}
                {s.away ? <span className="opacity-70">away</span> : null}
                {s.note ? <span className="truncate opacity-80">{s.note}</span> : null}
              </span>
              {s.badge ? (
                <span
                  className={cn(
                    "mb-display-sm absolute top-1.5 right-1.5 flex h-7 min-w-7 items-center justify-center px-1 text-lg tabular-nums",
                    s.selected
                      ? "bg-[var(--on-loud)] text-[var(--loud)]"
                      : "bg-[var(--loud)] text-[var(--on-loud)]",
                  )}
                >
                  {s.badge}
                </span>
              ) : null}
            </Seat>
          </li>
        );
      })}
    </ul>
  );
}
