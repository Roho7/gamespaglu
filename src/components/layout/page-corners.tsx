import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ScoreboardDrawer } from "@/components/scoreboard/scoreboard-drawer";
import { cn } from "@/lib/utils";

/** A square corner control that navigates. */
export function SquareLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("mb-square-btn", className)}
    >
      {children}
    </Link>
  );
}

/** The square back arrow. */
export function BackLink({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <SquareLink href={href} label="Back" className={className}>
      <ArrowLeft className="size-5" strokeWidth={3} aria-hidden />
    </SquareLink>
  );
}

/** The "?" that opens a game's guide. */
export function HelpLink({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  return (
    <SquareLink
      href={href}
      label="How to play"
      className={cn("mb-display-sm text-2xl", className)}
    >
      ?
    </SquareLink>
  );
}

/**
 * The corners of an inner page: back on the left, and on the right whatever
 * the page adds plus the scoreboard, which stays one tap away mid-game.
 * Pinned to the viewport, so it never scrolls away.
 */
export function PageCorners({
  back,
  extra,
  scoreboard = true,
}: {
  back: string;
  extra?: React.ReactNode;
  scoreboard?: boolean;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-between px-3">
      <BackLink href={back} className="pointer-events-auto" />
      <div className="pointer-events-auto flex gap-2">
        {extra}
        {scoreboard ? <ScoreboardDrawer /> : null}
      </div>
    </div>
  );
}
