import type { CategoryId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Category emblems, drawn as flat two-ink shapes in matchbox idiom.
 *
 * Emoji were wrong here: they're glossy modern artwork that always reads as
 * pasted onto a flat spot-ink field, and they can't take a colourway. These are
 * plain paths, so they recolour for free and scale to any size.
 *
 * Each emblem is painted twice — once offset in the shadow ink, once in the
 * face inks — which is what gives it the printed, slightly-misregistered look.
 */
type Shapes = (main: string, detail: string) => React.ReactNode;

const SHAPES: Record<CategoryId, Shapes> = {
  // Sunglasses.
  celebrity: (main, detail) => (
    <>
      <rect x="10" y="42" width="44" height="34" rx="10" fill={main} />
      <rect x="66" y="42" width="44" height="34" rx="10" fill={main} />
      <rect x="52" y="48" width="16" height="9" rx="4" fill={main} />
      <rect x="18" y="50" width="16" height="8" rx="4" fill={detail} />
      <rect x="74" y="50" width="16" height="8" rx="4" fill={detail} />
      <path d="M10 46 L2 36 L8 33 L14 43 Z" fill={main} />
      <path d="M110 46 L118 36 L112 33 L106 43 Z" fill={main} />
    </>
  ),
  // Clapperboard.
  movie: (main, detail) => (
    <>
      <rect x="12" y="46" width="96" height="52" rx="6" fill={main} />
      <path
        d="M12 30 L104 18 L108 34 L16 46 Z"
        fill={main}
      />
      <path d="M30 22 L38 33 L26 35 Z" fill={detail} />
      <path d="M52 19 L60 30 L48 32 Z" fill={detail} />
      <path d="M74 16 L82 27 L70 29 Z" fill={detail} />
      <rect x="24" y="60" width="34" height="7" rx="3" fill={detail} />
      <rect x="24" y="74" width="52" height="7" rx="3" fill={detail} />
    </>
  ),
  // Globe.
  place: (main, detail) => (
    <>
      <circle cx="60" cy="60" r="46" fill={main} />
      <ellipse
        cx="60"
        cy="60"
        rx="18"
        ry="46"
        fill="none"
        stroke={detail}
        strokeWidth="5"
      />
      <path d="M16 46 H104" stroke={detail} strokeWidth="5" />
      <path d="M16 74 H104" stroke={detail} strokeWidth="5" />
      <path d="M60 14 V106" stroke={detail} strokeWidth="5" />
    </>
  ),
  // Elephant.
  animal: (main, detail) => (
    <>
      <ellipse cx="52" cy="58" rx="34" ry="26" fill={main} />
      <circle cx="86" cy="52" r="22" fill={main} />
      <circle cx="86" cy="50" r="10" fill={detail} />
      <path
        d="M104 60 q12 10 6 24 q-3 8 -11 6 q-6 -2 -3 -9 q4 -9 -2 -15 Z"
        fill={main}
      />
      <rect x="26" y="78" width="13" height="26" rx="5" fill={main} />
      <rect x="48" y="78" width="13" height="26" rx="5" fill={main} />
      <rect x="70" y="76" width="13" height="28" rx="5" fill={main} />
      <path d="M20 50 q-12 -4 -14 6 q10 4 14 0 Z" fill={main} />
    </>
  ),
  // Pressure cooker.
  object: (main, detail) => (
    <>
      <path
        d="M24 44 H96 V84 q0 14 -14 14 H38 q-14 0 -14 -14 Z"
        fill={main}
      />
      <rect x="16" y="32" width="88" height="13" rx="5" fill={main} />
      <rect x="52" y="18" width="16" height="14" rx="4" fill={detail} />
      <rect x="46" y="12" width="28" height="8" rx="4" fill={main} />
      <rect x="96" y="50" width="20" height="9" rx="4" fill={main} />
      <rect x="34" y="60" width="34" height="6" rx="3" fill={detail} />
    </>
  ),
  // Die, five pips.
  number: (main, detail) => (
    <>
      <rect x="16" y="16" width="88" height="88" rx="16" fill={main} />
      <circle cx="40" cy="40" r="8" fill={detail} />
      <circle cx="80" cy="40" r="8" fill={detail} />
      <circle cx="60" cy="60" r="8" fill={detail} />
      <circle cx="40" cy="80" r="8" fill={detail} />
      <circle cx="80" cy="80" r="8" fill={detail} />
    </>
  ),
};

export function Emblem({
  category,
  className,
}: {
  category: CategoryId;
  className?: string;
}) {
  const shapes = SHAPES[category];
  return (
    <svg
      viewBox="-6 -6 132 132"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none", className)}
    >
      <g transform="translate(5,5)">
        {shapes(
          "var(--shadow-text, var(--shadow-ink))",
          "var(--shadow-text, var(--shadow-ink))",
        )}
      </g>
      <g>{shapes("var(--ink-on-field)", "var(--field)")}</g>
    </svg>
  );
}
