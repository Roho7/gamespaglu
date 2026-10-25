import type { Metadata } from "next";
import Link from "next/link";
import { PageCorners } from "@/components/layout/page-corners";
import { CrossPromo } from "@/components/layout/cross-promo";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { theme } from "@/lib/palettes";
import { GUIDES } from "@/content/guides";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How to play — rules for Mafia, Chameleon, Wavelength and more",
  description:
    "Rules, tactics and house variations for every game on Games Paglu: Mafia (Werewolf), Girgit (The Chameleon), Tiktiki (Spyfall), Wavelength, Who Am I? (Heads Up) and the Scoreboard.",
  path: "/how-to-play",
  shareTitle: "How to play every game on Games Paglu",
});

export default function HowToPlayIndex() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-3 pt-20 pb-12">
      <PageCorners />

      <header className="mb-tilt space-y-2 px-4 pb-6 text-center">
        <h1 className="mb-display-flipped text-5xl">How to play</h1>
      </header>

      <ul className="space-y-3">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link
              href={`/how-to-play/${guide.slug}`}
              {...theme(guide.palette)}
              className="mb-label group relative block space-y-2 px-8 py-10"
            >
              <StitchBorder variant="link" className="inset-2" />
              <h2 className="mb-display-sm text-3xl">{guide.title}</h2>
              <p className="text-sm font-medium">{guide.summary}</p>
              <p className="mb-caps flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-75">
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
