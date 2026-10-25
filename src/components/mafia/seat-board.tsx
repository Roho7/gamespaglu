"use client";

import { PlayerAvatar } from "@/components/room/player-avatar";
import type { Palette } from "@/lib/palettes";
import { cn } from "@/lib/utils";

export type SeatSlip = {
  id: string;
  name: string;
  you?: boolean;
  away?: boolean;
  out?: boolean;
  stamp?: string;
  note?: string;
  badge?: string | null;
  selected?: boolean;
  open?: boolean;
  abstain?: boolean;
};

const TILT = ["-rotate-[0.6deg]", "rotate-[0.5deg]", "rotate-[0.3deg]", "-rotate-[0.4deg]"];

export function SeatBoard({
  slips,
  palette,
  onSelect,
}: {
  slips: SeatSlip[];
  /** The screen's palette, which the faces are printed in. */
  palette: Palette;
  onSelect?: (id: string) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {slips.map((s, i) => {
        const tappable = Boolean(onSelect && s.open);
        const Seat = tappable ? "button" : "div";
        return (
          <li key={s.id} className={cn("flex", s.abstain && "col-span-2", !s.abstain && TILT[i % TILT.length])}>
            <Seat
              {...(tappable ? { type: "button" as const, onClick: () => onSelect?.(s.id) } : {})}
              aria-pressed={tappable ? Boolean(s.selected) : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 items-center gap-2.5 p-1.5 pr-2.5 text-left transition-[transform,box-shadow] duration-150",
                "border-[length:var(--rule-thin)] border-[color:var(--cw-secondary)] bg-[var(--cw-primary)] shadow-[4px_4px_0_var(--shadow-ink)]",
                s.abstain && "justify-center border-dashed bg-transparent py-3 shadow-none",
                tappable && "border-[color:var(--loud)] active:translate-[3px] active:shadow-[1px_1px_0_var(--shadow-ink)]",
                s.selected &&
                "-translate-y-1 border-[color:var(--cw-secondary)] bg-[var(--cw-highlight)] text-[var(--on-loud)] shadow-[5px_7px_0_var(--shadow-ink)]",
                s.out && "translate-y-0.5 shadow-none",
              )}
            >
              {s.abstain ? null : (
                <span
                  aria-hidden
                  className={cn(
                    "size-11 shrink-0 overflow-hidden bg-[var(--loud)]",
                    s.out && "opacity-60",
                    s.selected && "border-[length:var(--rule-thin)] border-[color:var(--shadow-ink)]",
                  )}
                >
                  <PlayerAvatar seed={s.name} palette={palette} className="size-full scale-125" />
                </span>
              )}
              <span className={cn("flex min-w-0 flex-col", s.out && "opacity-60")}>
                <span className={cn("mb-display-sm truncate text-2xl leading-none", !s.abstain && "pr-6")}>
                  {s.name}
                </span>
                {s.you || s.away || s.note ? (
                  <span className="mb-caps flex max-w-full items-baseline gap-1.5 text-sm">
                    {s.you ? <span className="opacity-70">you</span> : null}
                    {s.away ? <span className="opacity-70">away</span> : null}
                    {s.note ? <span className="truncate opacity-80">{s.note}</span> : null}
                  </span>
                ) : null}
              </span>
              {s.stamp ? (
                <span className="pointer-events-none absolute inset-x-1 top-1/2 z-10 flex -translate-y-1/2 -rotate-[8deg] justify-center bg-destructive px-2 py-1">
                  <span className="mb-display-sm text-lg leading-none whitespace-nowrap text-destructive-foreground">
                    {s.stamp}
                  </span>
                </span>
              ) : null}
              {s.badge ? (
                <span
                  className={cn(
                    "mb-display-sm absolute -top-2 -right-2 flex h-7 min-w-7 items-center justify-center px-1 text-lg tabular-nums shadow-[2px_2px_0_var(--shadow-ink)]",
                    s.selected ? "bg-[var(--on-loud)] text-[var(--loud)]" : "bg-[var(--loud)] text-[var(--on-loud)]",
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
