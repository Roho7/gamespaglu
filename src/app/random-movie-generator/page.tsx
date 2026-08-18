import type { Metadata } from "next";
import { GeneratorPage } from "@/components/game/generator-page";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["movie"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

export default function Page() {
  return (
    <GeneratorPage category="movie">
      <>
        <h2 className="display text-lg">Bollywood to Hollywood</h2>
        <p>
          Filter by country, and switch individual Indian film industries on and
          off — Hindi, Tamil, Telugu, Malayalam and Kannada each have their own
          chip. Korean and Japanese lists are here too, for K-drama and anime
          nights.
        </p>
        <p>
          Also useful when nobody can decide what to watch. Tap generate and let
          the phone settle it.
        </p>
      </>
    </GeneratorPage>
  );
}
