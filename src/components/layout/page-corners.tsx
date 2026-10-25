"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ScoreboardDrawer } from "@/components/scoreboard/scoreboard-drawer";
import { ditherBack } from "@/lib/dither-transition";
import { cn } from "@/lib/utils";
import type { PublicPlayer } from "@shared/protocol";

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

/** The square back arrow: steps back through history, to wherever the player came from. */
export function BackLink({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => ditherBack(() => router.back())}
      className={cn("mb-square-btn", className)}
    >
      <ArrowLeft className="size-5" strokeWidth={3} aria-hidden />
    </button>
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
 * the page adds plus the scoreboard, which stays one tap away mid-game. A room passes its players,
 * so the scoreboard shows the room's totals rather than this phone's.
 * Pinned to the viewport, so it never scrolls away.
 */
export function PageCorners({
  extra,
  scoreboard = true,
  room,
}: {
  extra?: React.ReactNode;
  scoreboard?: boolean;
  room?: PublicPlayer[];
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-between px-3">
      <BackLink className="pointer-events-auto" />
      <div className="pointer-events-auto flex gap-2">
        {extra}
        {scoreboard ? <ScoreboardDrawer room={room} /> : null}
      </div>
    </div>
  );
}
