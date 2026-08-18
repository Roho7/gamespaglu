"use client";

import Link from "next/link";
import { ScoreboardDrawer } from "@/components/scoreboard/scoreboard-drawer";
import { cn } from "@/lib/utils";

/**
 * Every screen gets the same bar, which is how the scorecard ends up reachable
 * from everywhere by construction rather than by remembering to add it.
 */
export function AppBar({
  back,
  title,
  extra,
  className,
}: {
  back?: string;
  title?: React.ReactNode;
  /** Screen-specific controls, placed left of the scorecard. */
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex items-center justify-between gap-2 px-4 py-3", className)}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {back ? (
          <Link
            href={back}
            aria-label="Back"
            className="press flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--line)] bg-[var(--paper)] text-base text-[var(--ink)]"
          >
            ←
          </Link>
        ) : null}
        {title ? (
          <span className="display truncate text-lg">{title}</span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        <ScoreboardDrawer />
      </div>
    </header>
  );
}

/** Kept for the reading pages that imported the old name. */
export const TopBar = AppBar;
