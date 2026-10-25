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
