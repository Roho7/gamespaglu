import { cn } from "@/lib/utils";

/**
 * A theatre-marquee sign: a ring of chasing bulbs around a loud-ink panel.
 * It carries the one instruction a play surface needs right now, so it holds
 * a headline and at most one line under it.
 */
export function MarqueeBanner({
  headline,
  detail,
  className,
}: {
  headline: string;
  detail?: string | null;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("mb-marquee", className)}
    >
      <div className="mb-marquee-sign px-3 py-2.5 text-center">
        <p className="mb-display-sm text-3xl leading-none text-balance">
          {headline}
        </p>
        {detail ? (
          <p className="mt-1 text-sm leading-snug font-semibold text-balance">
            {detail}
          </p>
        ) : null}
      </div>
    </div>
  );
}
