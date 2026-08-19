import { SITE } from "@/lib/site";

/** One strip, in voice, never over a play surface. */
export function CrossPromo() {
  return (
    <a
      href={SITE.sibling.url}
      target="_blank"
      rel="noreferrer"
      className="mb-frame mt-10 block rounded-[var(--radius-lg)] p-4"
      data-analytics="cross-promo-officepaglu"
    >
      <p className="mb-display-sm text-xl">Office Paglu</p>
      <p className="mt-1 text-xs font-semibold">
        {SITE.sibling.pitch} Wear the joke to the party you just won. →
      </p>
    </a>
  );
}
