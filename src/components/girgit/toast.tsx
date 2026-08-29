"use client";

/**
 * A brief confirmation that a tap landed.
 *
 * Every action here is a round trip to a server in another country, so there is
 * a real gap between tapping and the screen changing. Without something in that
 * gap the tap reads as ignored — which is exactly what happened with the
 * Girgit's guess.
 */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <p className="animate-punch rounded-full border-[length:var(--rule-thin)] border-[color:var(--frame)] bg-[var(--band)] px-4 py-2 text-sm font-extrabold text-[var(--band-ink)] shadow-[0_4px_0_0_var(--shadow-ink)]">
        {message}
      </p>
    </div>
  );
}
