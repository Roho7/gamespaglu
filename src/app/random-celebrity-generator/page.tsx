import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/generator/generator-screen";
import { CATEGORIES } from "@/lib/deck/categories";
import { pageMetadata } from "@/lib/seo";

const meta = CATEGORIES["celebrity"];

export const metadata: Metadata = pageMetadata({
  title: meta.seoTitle,
  description: meta.seoDescription,
  path: `/${meta.seoSlug}`,
});

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
            and superheroes. Tap one chip to play that kind alone — Cartoon on
            its own is a ready-made round for kids.
          </p>
          <p>
            The deck starts with the names everyone knows right now, like
            MrBeast and Drake. Anime and superheroes are a tap away, and one
            checkbox lets Gandhi and Marilyn Monroe in too. Play India,
            Worldwide or both: Worldwide never deals an India-only name.
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
