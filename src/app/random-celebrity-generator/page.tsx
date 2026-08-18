import type { Metadata } from "next";
import { GeneratorPage } from "@/components/game/generator-page";
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
    <GeneratorPage category="celebrity">
      <>
        <h2 className="display text-lg">Indian and international, your call</h2>
        <p>
          Tap the country chips to decide where names come from. Selecting India
          adds language switches for Hindi, Tamil, Telugu, Malayalam and Kannada
          cinema — and the Indian list goes well beyond film, with cricketers,
          singers, politicians and business names in the mix.
        </p>
        <p>
          Every name is hand-checked to be someone a room full of people will
          actually recognise. Perfect for Who Am I?, charades, dumb charades and
          Heads Up style games.
        </p>
      </>
    </GeneratorPage>
  );
}
