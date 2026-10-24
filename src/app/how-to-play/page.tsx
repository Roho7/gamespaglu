import type { Metadata } from "next";
import Link from "next/link";
import { PageCorners } from "@/components/layout/page-corners";
import { CrossPromo } from "@/components/layout/cross-promo";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { paletteById, paletteVars } from "@/lib/palettes";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "How to play",
  description:
    "Rules and how-tos for every game on Games Paglu — Who Am I? (also called Heads Up or Celebrity Head), Girgit, Wavelength and the universal Scoreboard.",
  alternates: { canonical: "/how-to-play" },
};

export default function HowToPlayIndex() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-3 pt-20 pb-12">
      <PageCorners back="/" />

      <header className="mb-tilt space-y-2 px-4 pb-6 text-center">
        <h1 className="mb-display text-5xl">How to play</h1>
        <p className="text-sm font-semibold opacity-75">
          Every game, explained properly. Rules, tactics, variations, and the
          house rules worth arguing about.
        </p>
      </header>

      <ul className="space-y-3">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/how-to-play/${guide.slug}`}
              style={paletteVars(paletteById(guide.palette))}
              className="mb-label relative block space-y-2 px-8 py-10"
            >
              <StitchBorder className="inset-2" />
              <h2 className="mb-display-sm text-3xl">{guide.title}</h2>
              <p className="text-sm font-medium">{guide.summary}</p>
              <p className="mb-caps flex flex-wrap gap-x-4 gap-y-1 text-[0.6rem] opacity-75">
                <span>{guide.players} players</span>
                <span>{guide.needs}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <CrossPromo />
    </main>
  );
}
