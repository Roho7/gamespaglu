import type { Metadata } from "next";
import { GeneratorPage } from "@/components/game/generator-page";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["number"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

export default function Page() {
  return (
    <GeneratorPage category="number">
      <>
        <h2 className="display text-lg">How it works</h2>
        <p>
          Pick a preset or set your own minimum and maximum, then tap generate.
          Numbers are drawn without replacement, so within a range of 1000 or
          fewer you will not see the same number twice until the whole range has
          come up.
        </p>
        <p>
          Handy for picking who goes first, standing in for dice, raffles,
          classroom turns, or the number-guessing version of Who Am I? — the one
          often called Indian Poker.
        </p>
      </>
    </GeneratorPage>
  );
}
