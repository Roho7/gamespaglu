import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/game/generator-screen";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["celebrity"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

export default function Page() {
  return (
    <GeneratorScreen
      category="celebrity"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
        <p>
          Choose who counts: film and TV, music, sport, leaders, icons,
          YouTubers and influencers, plus cartoon characters, anime characters
          and superheroes. Tap one chip to play that kind alone — Cartoon on its
          own is a ready-made round for kids.
        </p>
        <p>
          A separate era toggle switches between classic and modern, so you can
          have a round of Gandhi and Marilyn Monroe or a round of MrBeast and
          Drake. Filter by country, kind of famous and era.
        </p>
        <p>
          Every name is hand-checked to be someone a room will actually
          recognise, because an unguessable name kills a round.
        </p>
      </>
      }
    />
  );
}
