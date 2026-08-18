import type { Metadata } from "next";
import { GeneratorPage } from "@/components/game/generator-page";
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
    <GeneratorPage category="object">
      <>
        <h2 className="display text-lg">Everyday things you can point at</h2>
        <p>
          Pressure cooker, ceiling fan, cricket bat, safety pin. Ordinary
          objects are funnier than exotic ones in guessing games, so the list
          stays firmly in the house.
        </p>
      </>
    </GeneratorPage>
  );
}
