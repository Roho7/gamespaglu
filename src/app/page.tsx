import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { CategoryRail } from "@/components/game/category-rail";
import { CrossPromo } from "@/components/cross-promo";
import { IconLink } from "@/components/brutal";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <>
      <AppBar
        title={
          <span className="display text-xl leading-none">Games Paglu</span>
        }
        extra={
          <IconLink href="/how-to-play" aria-label="How to play">
            ?
          </IconLink>
        }
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10">
        <p className="caps mb-4 text-[0.65rem] opacity-50">
          Party games · no setup · works offline
        </p>

        <h1 className="display mb-4 text-2xl">
          Phone on your forehead.{" "}
          <span className="opacity-45">Everyone sees it but you.</span>
        </h1>

        <CategoryRail />

        <Link href="/how-to-play/secret-hitler" className="mt-10 block">
          <div className="flex items-center gap-3 rounded-[20px] border-2 border-dashed border-[var(--line)] p-4 opacity-60">
            <span className="text-2xl grayscale" aria-hidden>
              🕵️
            </span>
            <div>
              <span className="display text-base">Rooms — not built yet</span>
              <p className="mt-0.5 text-xs font-medium opacity-70">
                Secret Hitler and imposter games, when they exist. Read the plan →
              </p>
            </div>
          </div>
        </Link>

        <CrossPromo />

        <footer className="mt-6 text-xs font-medium opacity-40">
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
    </>
  );
}
