import { Ban, Eye, Search, Skull, Trophy, UserRoundPlus, type LucideIcon } from "lucide-react";
import { POWER_LABEL } from "@/content/secret-hitler-copy";
import { theme } from "@/lib/palettes";
import { cn } from "@/lib/utils";
import {
  CHAOS_AT,
  FASCIST_BOARDS,
  FASCIST_TO_WIN,
  LIBERAL_TO_WIN,
  VETO_AT,
  type ShBoard,
  type ShPower,
} from "@shared/protocol";

export const POWER_ICON: Record<ShPower, LucideIcon> = {
  investigate: Search,
  "special-election": UserRoundPlus,
  peek: Eye,
  execute: Skull,
};

const BOARD_PLAYERS: Record<ShBoard, string> = {
  small: "5 to 6 players",
  medium: "7 to 8 players",
  large: "9 to 10 players",
};

function Slot({ filled, icon: Icon, label }: { filled: boolean; icon?: LucideIcon; label?: string }) {
  return (
    <li
      className={cn(
        "flex aspect-[3/4] min-w-0 flex-col items-center justify-center gap-1 border-[length:var(--rule-thin)] border-[var(--cw-shadow)] px-0.5 text-center",
        filled ? "bg-[var(--cw-shadow)] text-[var(--cw-base)] shadow-[3px_3px_0_var(--cw-highlight)]" : "border-dashed",
      )}
    >
      {filled ? (
        <span className="mb-display-sm text-[clamp(1.1rem,5vw,1.6rem)] leading-none">{label}</span>
      ) : Icon ? (
        <>
          <Icon className="size-[clamp(1rem,4.5vw,1.4rem)]" strokeWidth={2.5} aria-hidden />
          <span className="mb-caps text-[0.5rem] leading-tight">{label}</span>
        </>
      ) : null}
    </li>
  );
}

function Track({
  title,
  palette,
  children,
  detail,
}: {
  title: string;
  palette: "cobalt" | "cherry";
  children: React.ReactNode;
  detail: string;
}) {
  return (
    <section {...theme(palette)} className="bg-[var(--cw-base)] p-2.5 text-[var(--cw-shadow)]">
      <header className="mb-1.5 flex items-baseline justify-between gap-2">
        <h3 className="mb-display-sm text-xl leading-none">{title}</h3>
        <p className="mb-caps text-[0.55rem] opacity-80">{detail}</p>
      </header>
      {children}
    </section>
  );
}

export function PolicyBoard({
  board,
  liberal,
  fascist,
  tracker,
  deckCount,
  discardCount,
}: {
  board: ShBoard;
  liberal: number;
  fascist: number;
  tracker: number;
  deckCount: number;
  discardCount: number;
}) {
  const powers = FASCIST_BOARDS[board];
  return (
    <div className="space-y-2" aria-label="Policy board">
      <Track title="Liberal" palette="cobalt" detail={`${liberal} of ${LIBERAL_TO_WIN}`}>
        <ol className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: LIBERAL_TO_WIN }, (_, i) => (
            <Slot
              key={i}
              filled={i < liberal}
              label={i < liberal ? "L" : i === LIBERAL_TO_WIN - 1 ? "Win" : undefined}
              icon={i === LIBERAL_TO_WIN - 1 ? Trophy : undefined}
            />
          ))}
        </ol>
      </Track>
      <Track title="Fascist" palette="cherry" detail={`${fascist} of ${FASCIST_TO_WIN} · ${BOARD_PLAYERS[board]}`}>
        <ol className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: FASCIST_TO_WIN }, (_, i) => {
            const power = powers[i] ?? null;
            const win = i === FASCIST_TO_WIN - 1;
            return (
              <Slot
                key={i}
                filled={i < fascist}
                label={i < fascist ? "F" : win ? "Win" : power ? POWER_LABEL[power] : undefined}
                icon={win ? Trophy : power ? POWER_ICON[power] : undefined}
              />
            );
          })}
        </ol>
        <p className="mb-caps mt-1.5 flex items-center gap-1 text-[0.55rem] opacity-80">
          <Ban className="inline size-[1em]" strokeWidth={3} aria-hidden />
          {fascist >= VETO_AT ? "Veto unlocked" : `Veto unlocks at ${VETO_AT}`}
          {fascist >= 3 ? " · Electing Hitler now loses it" : " · From 3, electing Hitler loses it"}
        </p>
      </Track>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="mb-caps text-sm">Election tracker</span>
          <ol className="flex gap-1" aria-label={`${tracker} of ${CHAOS_AT} failed elections`}>
            {Array.from({ length: CHAOS_AT }, (_, i) => (
              <li
                key={i}
                className={cn(
                  "size-4 border-[length:var(--rule-thin)] border-current",
                  i < tracker && "bg-[var(--loud)]",
                )}
              />
            ))}
          </ol>
        </div>
        <p className="mb-caps text-sm">
          Deck {deckCount} · Discard {discardCount}
        </p>
      </div>
    </div>
  );
}
