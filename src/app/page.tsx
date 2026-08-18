import Link from "next/link";
import { CATEGORY_LIST } from "@/lib/categories";
import { CrossPromo } from "@/components/cross-promo";
import { SITE } from "@/lib/site";

/**
 * Category-first. The six things you can become ARE what the site does, so they
 * are the hero — no prose, no explanation, one tap to play. Everything wordy
 * lives in How to play.
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-5 pb-8">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="display text-4xl leading-[0.85] sm:text-5xl">
            Games
            <br />
            Paglu
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] opacity-55">
            Party games · no setup · offline
          </p>
        </div>
        <Link
          href="/how-to-play"
          aria-label="How to play"
          className="press brutal-sm flex size-10 shrink-0 items-center justify-center bg-[var(--paper)] text-lg font-black"
        >
          ?
        </Link>
      </header>

      <h2 className="display mb-3 text-base opacity-55">
        Phone on your forehead. Be a…
      </h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CATEGORY_LIST.map((c) => (
          <li key={c.id}>
            <Link href={`/who-am-i/${c.id}`} className="block">
              <div
                className="tile press flex h-28 flex-col justify-between p-3 text-[var(--on-accent)] sm:h-32"
                style={{ background: `var(${c.accentVar})` }}
              >
                <span className="text-3xl" aria-hidden>
                  {c.emoji}
                </span>
                <span className="display text-xl leading-none">{c.label}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/scoreboard" className="mt-3 block">
        <div className="brutal press flex items-stretch bg-[var(--paper)]">
          <div
            className="flex w-14 shrink-0 items-center justify-center border-r-2 border-[var(--line)] text-2xl"
            style={{ background: "var(--cat-number)" }}
            aria-hidden
          >
            🏆
          </div>
          <div className="px-4 py-3">
            <span className="display text-2xl leading-none">Scoreboard</span>
            <p className="mt-1 text-xs font-bold opacity-60">
              Keep score for any game. Cards, carrom, antakshari.
            </p>
          </div>
        </div>
      </Link>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-wide opacity-55">
        <Link href="/how-to-play" className="underline decoration-2">
          How to play
        </Link>
        <Link href="/how-to-play/secret-hitler" className="underline decoration-2">
          Rooms coming later
        </Link>
      </nav>

      <CrossPromo />

      <footer className="mt-6 text-xs font-bold opacity-40">
        {SITE.domain} · by the same paglus as{" "}
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
