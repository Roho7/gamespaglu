"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * The round's clock, in minutes and seconds, readable across the table. It counts to the server's
 * absolute deadline so every phone agrees; with no deadline it is paused and shows what was left.
 */
export function RoundClock({ deadlineAt, msLeft, roundMs }: { deadlineAt: number | null; msLeft: number; roundMs: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (deadlineAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadlineAt]);

  const left = deadlineAt === null ? msLeft : Math.max(0, deadlineAt - now);
  const urgent = deadlineAt !== null && left <= 30_000;

  return (
    <div className="mx-auto w-full max-w-xs space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="mb-caps text-sm opacity-70">{deadlineAt === null ? "Clock stopped" : "Time left"}</span>
        <span className={cn("mb-display-sm text-3xl tabular-nums", urgent && "text-[var(--cw-highlight)]")}>
          {mmss(left)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden border-[length:var(--rule-thin)] border-current/40">
        <div
          className={cn("h-full bg-current transition-[width] duration-200 ease-linear", urgent && "bg-[var(--cw-highlight)]")}
          style={{ width: `${Math.min(1, left / roundMs) * 100}%` }}
        />
      </div>
    </div>
  );
}
