import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeGameCard } from "@/components/home/home-game-card";
import { paletteById, paletteVars } from "@/lib/palettes";
import { SITE } from "@/lib/site-config";

/**
 * Four full-screen sections that snap vertically: Heads Up, Girgit,
 * Wavelength, and the Office Paglu banner.
 *
 * The page owns the scroll container rather than the body, so the snap points
 * are reliable and the floating bar never scrolls away.
 */
export default function Home() {
  return (
    <>
      <main className="h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto">
        <HomeGameCard
          href="/headsup"
          palette="tangerine"
          title="Heads Up"
          tagline="Phone on your forehead. Everyone knows but you."
          image="/backgrounds/heads-up.jpg"
        />

        <HomeGameCard
          href="/girgit"
          palette="jungle"
          title="Girgit"
          tagline="Everyone gets the word. One of you doesn't."
          image="/backgrounds/chameleon.jpg"
        />

        <HomeGameCard
          href="/wavelength"
          palette="miami"
          title="Wavelength"
          tagline="One clue. How close can your team get?"
          image="/backgrounds/wavelength.jpg"
        >
          <Link
            href="/how-to-play"
            className="mb-caps relative mt-auto text-[0.6rem] underline decoration-2"
          >
            How to play
          </Link>
        </HomeGameCard>

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
              Shop the tees{" "}
              <ArrowRight
                className="size-[1em] shrink-0"
                strokeWidth={3}
                aria-hidden
              />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
