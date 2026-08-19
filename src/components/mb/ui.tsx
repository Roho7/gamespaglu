"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared matchbox controls. Every visual here is a recipe from globals.css —
 * .mb-frame, .mb-btn, .mb-icon-btn, .mb-caps — so there is exactly one place
 * per concept and `npm run check:tokens` can guarantee no colour is named.
 */

/** Filter chip. Selected = printed in the field ink; unselected = outline only. */
export function Chip({
  active,
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...props}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-[var(--rule-thin)] px-3 py-1.5 text-sm font-bold transition-transform active:translate-y-[1px]",
        active
          ? "border-current bg-[var(--field)] text-[var(--ink-on-field)]"
          : "border-current bg-transparent opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A kraft panel for reading surfaces. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border-[var(--rule-thin)] border-current bg-[var(--ground-soft)] p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button {...props} className={cn("mb-icon-btn", className)}>
      {children}
    </button>
  );
}

export function IconLink({
  href,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link href={href} {...props} className={cn("mb-icon-btn", className)}>
      {children}
    </Link>
  );
}
