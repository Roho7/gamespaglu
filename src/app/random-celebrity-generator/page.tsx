import type { Metadata } from "next";
import { GeneratorScreen } from "@/components/game/generator-screen";
import { CATEGORIES } from "@/lib/categories";

const meta = CATEGORIES["celebrity"];

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: `/${meta.seoSlug}` },
  openGraph: { title: meta.seoTitle, description: meta.seoDescription },
};

export default function Page() {
  return (
    <GeneratorScreen
      category="celebrity"
      mode="tool"
      heading={meta.seoTitle}
      about={
        <>
        <p>
          Choose the countries names come from. Turning on India adds switches
          for Hindi, Tamil, Telugu, Malayalam and Kannada cinema, and the Indian
          list reaches well past film — cricketers, singers, politicians and
          business names are all in the deck.
        </p>
        <p>
          Every name is hand-checked to be someone a room will actually
          recognise, because an unguessable name kills a round.
        </p>
      </>
      }
    />
  );
}
