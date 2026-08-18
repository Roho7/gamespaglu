import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/game/generator-screen";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["place"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

export default function Page() {
  return (
    <GeneratorScreen
      category="place"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
        <p>
          Famous places only — landmarks, cities and countries — so questions
          like &ldquo;am I in Asia?&rdquo; and &ldquo;do tourists photograph
          me?&rdquo; both work. The Indian list runs from the Taj Mahal to the
          Rann of Kutch.
        </p>
      </>
      }
    />
  );
}
