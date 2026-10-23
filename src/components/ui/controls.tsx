"use client";

import { cn } from "@/lib/utils";

/**
 * Shared matchbox controls. Every visual here is a recipe from globals.css —
 * .mb-frame, .mb-btn, .mb-icon-btn, .mb-caps — so there is exactly one place
 * per concept and `npm run check:tokens` can guarantee no colour is named.
 */

/** Filter chip. Selected is filled with the dark ink; unselected is outlined. */
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
        "mb-display-sm inline-flex items-center gap-1.5 border-[length:var(--rule-thin)] border-[var(--cw-shadow)] px-3 pt-1.5 pb-1 text-xl transition-transform active:translate-y-[1px]",
        active
          ? "bg-[var(--cw-shadow)] text-[var(--cw-base)]"
          : "bg-transparent text-[var(--cw-shadow)]",
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
        "rounded-[var(--radius-lg)] border-[length:var(--rule-thin)] border-current bg-[var(--ground-soft)] p-4",
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
