"use client";

import Link from "next/link";
import { ScoreboardDrawer } from "@/components/scoreboard/scoreboard-drawer";
import { cn } from "@/lib/utils";

/**
 * A single floating pill, fixed over the content, on every screen.
 *
 * Floating rather than docked because the play surface and the home sections
 * are full-bleed colour — a bar with its own background would cut the screen in
 * two. Being on every screen by construction is also what keeps the scorecard
 * one tap away from anywhere.
 *
 * Segments are divided by hairlines, like the reference: [back] | [title] |
 * [extras] | [score].
 */
export function AppBar({
  back,
  title,
  titleHidden,
  extra,
  className,
}: {
  back?: string;
  title?: React.ReactNode;
  /** Keep the heading in the DOM for crawlers and screen readers, off-screen. */
  titleHidden?: boolean;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3",
        className,
      )}
    >
      {titleHidden && title ? <h1 className="sr-only">{title}</h1> : null}

      <nav className="pointer-events-auto flex max-w-full items-stretch overflow-hidden rounded-full border-[var(--rule-thin)] border-[var(--ground-ink)] bg-[var(--ground)] text-[var(--ground-ink)] shadow-[0_4px_0_0_var(--shadow-ink)]">
        {back ? (
          <Link
            href={back}
            aria-label="Back"
            className="flex items-center px-4 py-2 text-base font-extrabold active:translate-y-[1px]"
          >
            ←
          </Link>
        ) : null}

        {title && !titleHidden ? (
          <span className="mb-caps flex items-center border-x-[var(--rule-thin)] border-[var(--ground-ink)] px-4 py-2 text-[0.65rem] whitespace-nowrap first:border-l-0">
            {title}
          </span>
        ) : null}

        {extra ? (
          <div className="flex items-stretch [&>*]:flex [&>*]:items-center [&>*]:border-r-[var(--rule-thin)] [&>*]:border-[var(--ground-ink)] [&>*]:px-3.5 [&>*]:py-2">
            {extra}
          </div>
        ) : null}

        <ScoreboardDrawer />
      </nav>
    </div>
  );
}
