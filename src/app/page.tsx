import Link from "next/link";
import { LIVE_GAMES } from "@/lib/games";
import { CATEGORY_LIST } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { CrossPromo } from "@/components/cross-promo";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <header className="mb-6">
        <h1 className="display text-5xl leading-none">
          Games
          <br />
          Paglu
        </h1>
        <p className="mt-3 text-sm font-bold opacity-70">
          Your phone, but for games played in a room with actual people.
          Nothing to install, nothing to sign up for, works without signal.
        </p>
      </header>

      <ul className="space-y-4">
        {LIVE_GAMES.map((game) => (
          <li key={game.id}>
            <Link href={game.route} className="block">
              <div
                className="brutal press flex items-center gap-4 p-5 text-[var(--on-accent)]"
                style={{ background: `var(${game.accentVar})` }}
              >
                <span className="text-4xl" aria-hidden>
                  {game.emoji}
                </span>
                <div>
                  <h2 className="display text-3xl">{game.name}</h2>
                  <p className="mt-1 text-xs font-bold opacity-70">
                    {game.tagline}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="display text-xl">Just need a random one?</h2>
        <p className="mt-1 text-xs font-bold opacity-60">
          Every category also works as a plain generator.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {CATEGORY_LIST.map((c) => (
            <li key={c.id}>
              <Link
                href={`/${c.seoSlug}`}
                className="press brutal-sm flex items-center gap-2 bg-[var(--paper)] px-3 py-3 text-sm font-bold"
              >
                <span aria-hidden>{c.emoji}</span>
                Random {c.noun}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="display text-xl">Coming later</h2>
        <p className="mt-1 text-sm font-bold opacity-60">
          Rooms — everyone joins with a code on their own phone, for Secret
          Hitler, Connections and imposter games. Not yet. Soon.
        </p>
      </section>

      <CrossPromo />

      <footer className="mt-8 pb-2 text-xs font-bold opacity-50">
        {SITE.domain} · made by the same paglus as{" "}
        <a
          href={SITE.sibling.url}
          className="underline decoration-2"
          target="_blank"
          rel="noreferrer"
        >
          officepaglu.com
        </a>
      </footer>
    </main>
  );
}
