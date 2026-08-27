import type { Metadata } from "next";
import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { colourwayById, colourwayVars } from "@/lib/colourways";
import { CrossPromo } from "@/components/cross-promo";
import { GUIDES } from "@/content/guides";

export const metadata: Metadata = {
  title: "How to play",
  description:
    "Rules and how-tos for every game on Games Paglu — Who Am I? (also called Heads Up or Celebrity Head), the universal Scoreboard, and the imposter games coming next.",
  alternates: { canonical: "/how-to-play" },
};

export default function HowToPlayIndex() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 pt-20">
      <AppBar back="/" title="How to play" />
      <div className="space-y-6 px-4 pb-12">
        <p className="text-sm font-bold opacity-70">
          Every game, explained properly. Rules, tactics, variations, and the
          house rules worth arguing about.
        </p>

        <ul className="space-y-4">
          {GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/how-to-play/${guide.slug}`} className="block">
                <article className="overflow-hidden rounded-[var(--radius-lg)] border-[var(--rule-thin)] border-current bg-[var(--ground-soft)]">
                  <div
                    className="mb-frame flex items-center gap-3 rounded-none border-x-0 border-t-0 p-4"
                    style={colourwayVars(colourwayById(guide.colourway))}
                  >
                    <span className="text-3xl" aria-hidden>
                      {guide.emoji}
                    </span>
                    <h2 className="mb-display-sm text-xl">{guide.title}</h2>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-sm font-medium opacity-80">
                      {guide.summary}
                    </p>
                    <div className="mb-caps flex flex-wrap gap-x-4 gap-y-1 text-[0.6rem] opacity-60">
                      <span>{guide.players} players</span>
                      <span>{guide.needs}</span>
                      {guide.status === "planned" ? (
                        <span>Coming later</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>

        <CrossPromo />
      </div>
    </main>
  );
}
