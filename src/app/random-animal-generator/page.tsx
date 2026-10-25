import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/generator/generator-screen";
import { CATEGORIES } from "@/lib/deck/categories";
import { pageMetadata } from "@/lib/seo";

const meta = CATEGORIES["animal"];

export const metadata: Metadata = pageMetadata({
  title: meta.seoTitle,
  description: meta.seoDescription,
  path: `/${meta.seoSlug}`,
});

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
