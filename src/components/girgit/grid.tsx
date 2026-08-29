"use client";

import { cn } from "@/lib/utils";

/**
 * The 4x4 grid. This is the board, and the only board — nothing goes on the
 * table.
 *
 * Cells are deliberately plain: sixteen dotted matchbox frames at 80px would be
 * unreadable noise, so the double-rule treatment stays on the label around them
 * and the cells carry a single rule in the frame ink.
 *
 * Nothing here ever marks the secret. A highlighted cell is legible by POSITION
 * from across a table — you do not even have to read it — so the secret is
 * shown only in SecretHold's fixed slot. `markIndex` is for the reveal, once
 * there is no secret left to keep.
 */
export function GirgitGrid({
  cells,
  onPick,
  markIndex,
  disabled,
}: {
  cells: string[];
  onPick?: (index: number) => void;
  /** Reveal only. */
  markIndex?: number | null;
  disabled?: boolean;
}) {
  const pickable = Boolean(onPick) && !disabled;

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {cells.map((word, i) => {
        const marked = markIndex === i;
        return (
          <button
            key={`${word}-${i}`}
            type="button"
            disabled={!pickable}
            aria-label={pickable ? `Guess ${word}` : undefined}
            onClick={() => onPick?.(i)}
            className={cn(
              "flex min-h-[3.6rem] items-center justify-center rounded-[var(--radius-sm)]",
              // Explicit type hints: `border-[var(--rule-thin)]` next to
              // `border-[var(--frame)]` collides — Tailwind cannot tell a
              // width from a colour, and the cells rendered with NO rule.
              "border-[length:var(--rule-thin)] border-[color:var(--frame)] px-1 py-1",
              "text-center text-[0.62rem] leading-[1.15] font-bold tracking-[0.02em] uppercase",
              "hyphens-auto transition-transform",
              marked
                ? "bg-[var(--highlight)] text-[var(--shadow-text,var(--shadow-ink))]"
                : "bg-transparent text-[var(--ink-on-field)]",
              pickable && "active:translate-y-[2px] active:scale-[0.98]",
              !pickable && "cursor-default",
            )}
          >
            {word}
          </button>
        );
      })}
    </div>
  );
}
