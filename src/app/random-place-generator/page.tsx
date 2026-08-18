import type { Metadata } from "next";
import { GeneratorPage } from "@/components/game/generator-page";
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
    <GeneratorPage category="place">
      <>
        <h2 className="display text-lg">Landmarks, cities and countries</h2>
        <p>
          Famous places only, so questions like &ldquo;am I in Asia?&rdquo; and
          &ldquo;do tourists take photos of me?&rdquo; both make sense. The
          Indian list is deliberately deep — Taj Mahal through to the Rann of
          Kutch.
        </p>
      </>
    </GeneratorPage>
  );
}
