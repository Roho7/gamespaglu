"use client";

import Link from "next/link";
import { ScoreboardDrawer } from "@/components/scoreboard/scoreboard-drawer";
import { cn } from "@/lib/utils";

/**
 * Every screen renders this, which is how the scorecard stays one tap away from
 * anywhere by construction rather than by remembering to add it.
 *
 * onField = sitting on a saturated label field (play screens), so controls are
 * drawn in the frame ink. Otherwise it sits on kraft and uses the page ink.
 */
export function AppBar({
  back,
  title,
  extra,
  onField,
  className,
}: {
  back?: string;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  onField?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2.5",
        onField
          ? "text-[var(--ink-on-field)]"
          : "text-[var(--ground-ink)]",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {back ? (
          <Link href={back} aria-label="Back" className="mb-icon-btn shrink-0">
            ←
          </Link>
        ) : null}
        {title ? <div className="min-w-0">{title}</div> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {extra}
        <ScoreboardDrawer />
      </div>
    </header>
  );
}
