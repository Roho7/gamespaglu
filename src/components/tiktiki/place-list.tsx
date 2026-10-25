"use client";

import { cn } from "@/lib/utils";
import { placeName, type PlaceId } from "@shared/protocol";

/**
 * The places on the table as a detective's notepad: numbered lines, one place each. In the drawer
 * a tap crosses a line out; on the guess screen it circles the one you are calling.
 */
export function PlaceList({
  places,
  crossed,
  selected,
  onTap,
}: {
  places: PlaceId[];
  crossed?: ReadonlySet<PlaceId>;
  selected?: PlaceId | null;
  onTap?: (id: PlaceId) => void;
}) {
  return (
    <ol className="border-t-[length:var(--rule-thin)] border-current">
      {places.map((id, i) => {
        const out = crossed?.has(id) ?? false;
        const on = selected === id;
        return (
          <li key={id} className="border-b border-dashed border-current/50">
            <button
              type="button"
              aria-pressed={onTap ? (crossed ? out : on) : undefined}
              onClick={() => onTap?.(id)}
              className={cn(
                "flex w-full items-baseline gap-3 px-2 py-2.5 text-left transition-colors",
                on && "bg-[var(--loud)] text-[var(--on-loud)]",
              )}
            >
              <span className="mb-caps w-6 shrink-0 text-sm tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={cn(
                  "mb-display-sm text-2xl leading-none decoration-[3px]",
                  out && "line-through opacity-45",
                )}
              >
                {placeName(id)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
