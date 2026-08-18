"use client";

import { usePersisted } from "@/lib/use-persisted";

const KEY = "seen-how-to:who-am-i";

export function HowToPlay({ noun }: { noun: string }) {
  const [dismissed, setDismissed] = usePersisted<boolean>(KEY, false);
  if (dismissed) return null;

  return (
    <div className="brutal bg-[var(--accent-flood)] p-4 text-[var(--on-accent)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 text-sm font-bold">
          <p>1. Hit generate, then put the phone on your forehead — screen out.</p>
          <p>2. Everyone can see your {noun}. You can&apos;t.</p>
          <p>3. Ask questions till you get it. Then hit generate again.</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss instructions"
          onClick={() => setDismissed(true)}
          className="press brutal-sm shrink-0 bg-[var(--paper)] px-2 py-1 text-sm font-black text-[var(--ink)]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
