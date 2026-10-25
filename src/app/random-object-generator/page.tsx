import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/generator/generator-screen";
import { CATEGORIES } from "@/lib/deck/categories";
import { pageMetadata } from "@/lib/seo";

const meta = CATEGORIES["object"];

export const metadata: Metadata = pageMetadata({
  title: meta.seoTitle,
  description: meta.seoDescription,
  path: `/${meta.seoSlug}`,
});

export default function Page() {
  return (
    <GeneratorScreen
      category="object"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
          <p>
            Everyday things you can point at — pressure cooker, ceiling fan,
            cricket bat, safety pin. Ordinary objects are funnier than exotic
            ones in a guessing game.
          </p>
        </>
      }
    />
  );
}
