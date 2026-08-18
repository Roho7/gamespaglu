"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Pill buttons, deliberately smaller than the old full-bleed slabs. */
export function BrutalButton({
  children,
  className,
  variant = "solid",
  size = "md",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "solid" | "paper" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      {...props}
      className={cn(
        "press display inline-flex items-center justify-center gap-2 select-none",
        variant !== "ghost" && "pill",
        variant === "solid" && "bg-[var(--ink)] text-[var(--paper)]",
        variant === "paper" && "bg-[var(--paper)] text-[var(--ink)]",
        variant === "accent" && "bg-[var(--accent-flood)] text-[var(--on-accent)]",
        variant === "ghost" && "underline decoration-2 underline-offset-4",
        size === "sm" && "px-3.5 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-base",
        size === "lg" && "px-8 py-3.5 text-xl",
        "disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

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
        "press inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-semibold",
        active
          ? "border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]"
          : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] opacity-70",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-soft bg-[var(--paper)] p-4", className)}>
      {children}
    </div>
  );
}

/** Small round icon control, used in the app bar. */
export function IconButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={cn(
        "press flex size-9 items-center justify-center rounded-full border-2 border-[var(--line)] bg-[var(--paper)] text-base text-[var(--ink)]",
        className,
      )}
    >
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
    <Link
      href={href}
      {...props}
      className={cn(
        "press flex size-9 items-center justify-center rounded-full border-2 border-[var(--line)] bg-[var(--paper)] text-base text-[var(--ink)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
