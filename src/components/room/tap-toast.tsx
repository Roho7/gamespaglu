"use client";

/**
 * A brief confirmation that a tap landed. Every room action is a round trip to a server, and without
 * something in that gap the tap reads as ignored.
 */
export function TapToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <p className="animate-punch border-[length:var(--rule-thin)] border-[color:var(--cw-secondary)] bg-[var(--band)] px-4 py-2 text-sm font-extrabold text-[var(--band-ink)] shadow-[0_4px_0_0_var(--shadow-ink)]">
        {message}
      </p>
    </div>
  );
}
