import { SITE } from "@/lib/site";

/** One strip, in voice, never over a game screen. */
export function CrossPromo() {
  return (
    <a
      href={SITE.sibling.url}
      target="_blank"
      rel="noreferrer"
      className="press brutal mt-10 block bg-[var(--hot)] p-4 text-[var(--on-hot)]"
      data-analytics="cross-promo-officepaglu"
    >
      <p className="display text-xl">Office Paglu</p>
      <p className="mt-1 text-xs font-bold">
        {SITE.sibling.pitch} Wear the joke to the party you just won. →
      </p>
    </a>
  );
}
