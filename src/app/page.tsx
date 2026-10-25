import { ArrowRight } from "lucide-react";
import { HomeGameCard } from "@/components/home/home-game-card";
import { theme } from "@/lib/palettes";
import { SITE } from "@/lib/site-config";


export default function Home() {
  return (
    <>
      <main className="h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto">
        <HomeGameCard
          more
          href="/wavelength"
          help="/how-to-play/wavelength"
          palette="miami"
          title="Play Wavelength"
          tagline="Do you share the same vibe?"
          image="/backgrounds/wavelength.jpg"
          rows={[
            { text: "Wave", kind: "title" },
            { text: "Length", kind: "title" },
          ]}
        />

        <HomeGameCard
          more
          href="/who-am-i"
          help="/how-to-play/who-am-i"
          palette="tangerine"
          title="Play Who Am I?"
          tagline="Phone on forehead. Guess who you are."
          image="/backgrounds/who-am-i.jpg"
          rows={[
            { text: "Who", kind: "title" },
            { text: "Am I?", kind: "title" },
            { text: "(Heads up)", kind: "subtitle" },
          ]}
        />

        <HomeGameCard
          more
          href="/girgit/new"
          help="/how-to-play/girgit"
          palette="jungle"
          title="Play Girgit"
          tagline="Find the imposter who doesn't know the word."
          image="/backgrounds/chameleon.jpg"
          rows={[
            { text: "Girgit", kind: "title" },
            { text: "(Chameleon)", kind: "subtitle" },
          ]}
        />

        <HomeGameCard
          href="/mafia/new"
          help="/how-to-play/mafia"
          palette="cherry"
          title="Play Mafia"
          tagline="Secret roles. No narrator. Trust nobody."
          image="/backgrounds/mafia-1.jpg"
          rows={[{ text: "Mafia", kind: "title" }]}
        />

        {/* <section
          {...theme("pulp")}
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
        </section> */}
      </main>
    </>
  );
}
