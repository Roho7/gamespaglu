import Link from "next/link";
import { CategoryHeroRail } from "@/components/home/category-hero-rail";
import { paletteById, paletteVars } from "@/lib/palettes";
import { SITE } from "@/lib/site-config";

/**
 * Three full-screen sections that snap vertically: the generators, what's
 * coming, and the Office Paglu banner. Swipe sideways inside the first.
 *
 * The page owns the scroll container rather than the body, so the snap points
 * are reliable and the floating bar never scrolls away.
 */
export default function Home() {
  return (
    <>
      <main className="h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto">
        <section className="relative h-full snap-start">
          <CategoryHeroRail />
        </section>

        <section className="ground-navy flex h-full snap-start flex-col items-center justify-center gap-6 bg-[var(--ground)] px-6 text-center text-[var(--ground-ink)]">
          <p className="mb-caps text-[0.6rem] opacity-55">Now with rooms</p>
          <h2 className="mb-display-sm text-3xl">
            Girgit
            <span className="block text-xl opacity-60">
              Everyone gets the word.
            </span>
            <span className="block text-xl opacity-60">
              One of you doesn&apos;t.
            </span>
          </h2>
          <p className="max-w-sm text-sm font-medium opacity-70">
            Four to ten of you, one code, one grid of sixteen words. Write a
            clue, then work out who was bluffing.
          </p>
          <Link href="/girgit" className="mb-btn mb-btn-primary text-base">
            Play Girgit
          </Link>
          <Link
            href="/how-to-play"
            className="mb-caps text-[0.6rem] underline decoration-2 opacity-55"
          >
            How to play everything else
          </Link>
        </section>

        <section
          style={paletteVars(paletteById("pillar"))}
          className="mb-label mb-label-bleed h-full snap-start"
        >
          <div className="mb-label-field mb-tilt relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="mb-caps text-[0.6rem] opacity-75">
              From the same paglus
            </p>
            <h2 className="mb-display text-5xl">Office Paglu</h2>
            <p className="max-w-xs text-sm font-semibold">
              {SITE.sibling.pitch} Wear the joke to the party you just won.
            </p>
          </div>
          <div className="mb-band px-4 pt-3 pb-9">
            <a
              href={SITE.sibling.url}
              target="_blank"
              rel="noreferrer"
              data-analytics="cross-promo-officepaglu"
              className="mb-btn mb-btn-primary w-full max-w-sm text-xl"
            >
              Shop the tees →
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
