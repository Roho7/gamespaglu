/**
 * Nudge to turn the phone sideways during the countdown. Landscape gives the
 * word far more width — and a matchbox label is horizontal anyway — but it is
 * only ever a nudge: both orientations work, nothing is blocked.
 */
export function RotateHint() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 48 48"
        aria-hidden
        className="animate-rotate-hint size-10 origin-center"
      >
        <rect
          x="17"
          y="7"
          width="14"
          height="34"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <rect x="21" y="10" width="6" height="1.8" rx="0.9" fill="currentColor" />
      </svg>
      <p className="mb-caps text-[0.6rem] opacity-80">Turn sideways</p>
    </div>
  );
}
