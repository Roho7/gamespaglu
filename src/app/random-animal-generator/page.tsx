import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/game/generator-screen";
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
    <GeneratorScreen
      category="animal"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
        <p>
          Creatures people can actually name, from dog and cow to platypus and
          pangolin. Nothing out of a taxonomy textbook.
        </p>
      </>
      }
    />
  );
}
