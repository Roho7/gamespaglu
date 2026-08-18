import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/game/generator-screen";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["object"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

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
          cricket bat, safety pin. Ordinary objects are funnier than exotic ones
          in a guessing game.
        </p>
      </>
      }
    />
  );
}
