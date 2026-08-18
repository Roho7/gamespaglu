import type { Metadata } from "next";
import { GeneratorPage } from "@/components/game/generator-page";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["animal"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

export default function Page() {
  return (
    <GeneratorPage category="animal">
      <>
        <h2 className="display text-lg">Animals everyone can name</h2>
        <p>
          A curated list of creatures people actually know, from dog and cow to
          platypus and pangolin. Good for Who Am I?, charades with kids, and
          settling arguments about who acts out what.
        </p>
      </>
    </GeneratorPage>
  );
}
