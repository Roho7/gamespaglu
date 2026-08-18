import type { Metadata } from "next";
import Link from "next/link";
import { AppBar } from "@/components/app-bar";
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
    <main className="mx-auto w-full max-w-2xl flex-1">
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
                <article className="card-soft press overflow-hidden bg-[var(--paper)]">
                  <div
                    className="flex items-center gap-3 border-b-2 border-[var(--line)] p-4 text-[var(--on-accent)]"
                    style={{ background: `var(${guide.accentVar})` }}
                  >
                    <span className="text-3xl" aria-hidden>
                      {guide.emoji}
                    </span>
                    <h2 className="display text-xl leading-tight">
                      {guide.title}
                    </h2>
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-sm font-medium opacity-80">
                      {guide.summary}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-wide opacity-55">
                      <span>{guide.players} players</span>
                      <span>{guide.needs}</span>
                      {guide.status === "planned" ? (
                        <span className="text-[var(--hot)]">Coming later</span>
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
