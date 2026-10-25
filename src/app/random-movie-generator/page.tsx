import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/generator/generator-screen";
import { CATEGORIES } from "@/lib/deck/categories";
import { pageMetadata } from "@/lib/seo";

const meta = CATEGORIES["movie"];

export const metadata: Metadata = pageMetadata({
  title: meta.seoTitle,
  description: meta.seoDescription,
  path: `/${meta.seoSlug}`,
});

export default function Page() {
  return (
    <GeneratorScreen
      category="movie"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
          <p>
            Filter by country, and switch individual Indian film industries on
            and off — Hindi, Tamil, Telugu, Malayalam and Kannada each have
            their own switch. Korean and Japanese lists are here too.
          </p>
          <p>Also handy when nobody can decide what to watch.</p>
        </>
      }
    />
  );
}
