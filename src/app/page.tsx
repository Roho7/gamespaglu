import { AppBar } from "@/components/app-bar";
import { CategoryRail } from "@/components/game/category-rail";
import { CrossPromo } from "@/components/cross-promo";
import { IconLink } from "@/components/mb/ui";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    // Navy ground: the labels are meant to sit on something dark, like a
    // matchbox on a shop counter at night.
    <div className="ground-navy flex min-h-dvh flex-col bg-[var(--ground)] text-[var(--ground-ink)]">
      <AppBar
        title={<span className="mb-display-sm text-xl">Games Paglu</span>}
        extra={
          <IconLink href="/how-to-play" aria-label="How to play">
            ?
          </IconLink>
        }
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10">
        <h1 className="mb-display-sm text-3xl">Random generators</h1>
        <p className="mt-1.5 mb-5 text-sm font-semibold opacity-65">
          For Who Am I? or Heads Up.
        </p>

        <CategoryRail />

        <CrossPromo />

        <footer className="mt-6 text-xs font-medium opacity-45">
          Stickers by{" "}
          <a
            href="https://giphy.com"
            className="underline decoration-2"
            target="_blank"
            rel="noreferrer"
          >
            GIPHY
          </a>
          <br />
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
    </div>
  );
}
