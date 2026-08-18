"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrutalButton({
  children,
  className,
  variant = "solid",
  size = "md",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "solid" | "paper" | "accent" | "ghost";
  size?: "sm" | "md" | "xl";
}) {
  return (
    <button
      {...props}
      className={cn(
        "press display inline-flex items-center justify-center gap-2 select-none",
        variant !== "ghost" && "brutal",
        variant === "solid" && "bg-[var(--ink)] text-[var(--paper)]",
        variant === "paper" && "bg-[var(--paper)] text-[var(--ink)]",
        variant === "accent" &&
          "bg-[var(--accent-flood)] text-[var(--on-accent)]",
        variant === "ghost" && "underline decoration-4 underline-offset-4",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-5 py-3 text-lg",
        size === "xl" && "w-full px-6 py-6 text-3xl",
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
        "press brutal-sm inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold",
        active
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "bg-[var(--paper)] text-[var(--ink)]",
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
    <div className={cn("brutal bg-[var(--paper)] p-4", className)}>
      {children}
    </div>
  );
}

export function TopBar({
  back,
  title,
  right,
}: {
  back?: string;
  title?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        {back ? (
          <Link
            href={back}
            aria-label="Back"
            className="press brutal-sm bg-[var(--paper)] px-3 py-1.5 text-lg font-black"
          >
            ←
          </Link>
        ) : null}
        {title ? (
          <span className="display text-xl tracking-tight">{title}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
