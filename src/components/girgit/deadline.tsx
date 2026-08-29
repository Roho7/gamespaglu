"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The phase clock.
 *
 * Deliberately loud. The first real game stalled because two phones were locked
 * and nobody could tell the table was waiting on them — so this has to be
 * readable from the far side of a table without anybody explaining it.
 *
 * The deadline is an absolute time from the server, not a duration counted
 * locally, so every phone agrees and a reconnecting one lands on the right
 * number instead of restarting the count.
 */
export function Deadline({
  deadlineAt,
  totalSeconds,
  label,
}: {
  deadlineAt: number;
  totalSeconds: number;
  label: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const msLeft = Math.max(0, deadlineAt - now);
  const seconds = Math.ceil(msLeft / 1000);
  const fraction = Math.max(0, Math.min(1, msLeft / (totalSeconds * 1000)));
  // Ten seconds is where people start actually hurrying.
  const urgent = msLeft <= 10_000;

  return (
    <div className="w-full space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="mb-caps text-[0.55rem] opacity-70">{label}</span>
        <span
          className={cn(
            "mb-display-sm tabular-nums transition-transform",
            urgent ? "scale-110 text-[var(--highlight)] text-xl" : "text-base",
          )}
        >
          {seconds}s
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border-[length:var(--rule-thin)] border-current/40">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-linear",
            urgent ? "bg-[var(--highlight)]" : "bg-current",
          )}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
