"use client";

import { cn } from "@/lib/utils";

/**
 * The 4x4 grid. This is the board, and the only board — nothing goes on the
 * table.
 *
 * Cells are solid tiles in the dark ink with the loud ink as type, set in the
 * condensed display face so long words fit four across. Only a tile you can
 * tap (the caught Girgit's guess) gets the loud rule and hard shadow.
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
  guessIndex,
  disabled,
}: {
  cells: string[];
  onPick?: (index: number) => void;
  markIndex?: number | null;
  guessIndex?: number | null;
  disabled?: boolean;
}) {
  const pickable = Boolean(onPick) && !disabled;

  return (
    <div lang="en" className="grid grid-cols-4 gap-2">
      {cells.map((word, i) => {
        const marked = markIndex === i;
        const guessed = guessIndex === i && guessIndex !== markIndex;
        return (
          <button
            key={`${word}-${i}`}
            type="button"
            disabled={!pickable}
            aria-label={pickable ? `Guess ${word}` : undefined}
            onClick={() => onPick?.(i)}
            className={cn(
              "mb-display-sm flex min-h-14 items-center justify-center px-1 py-1.5",
              "border-[length:var(--rule-thin)] text-center text-[0.9rem] leading-[1.05]",
              "break-words hyphens-auto transition-transform",
              marked
                ? "border-[color:var(--loud)] bg-[var(--loud)] text-[var(--on-loud)]"
                : guessed
                  ? "border-dashed border-[color:var(--cw-shadow)] bg-transparent text-[var(--cw-shadow)] line-through"
                  : "border-transparent bg-[var(--cw-primary)] text-[var(--loud)]",
              pickable &&
              !marked &&
              "border-[color:var(--loud)] shadow-[3px_3px_0_var(--loud)] active:translate-[3px] active:shadow-none",
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
