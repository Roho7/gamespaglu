import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/game/generator-screen";
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
    <GeneratorScreen
      category="number"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
        <p>
          Pick a preset or set any range you like. Numbers are drawn without
          replacement, so inside a range of 1000 or fewer nothing repeats until
          the whole range has come up.
        </p>
        <p>
          Good for deciding who goes first, standing in for dice, raffles and
          classroom turns — or the numbers version of Who Am I?, the one often
          called Indian Poker.
        </p>
      </>
      }
    />
  );
}
