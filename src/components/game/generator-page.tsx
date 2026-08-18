import Link from "next/link";
import { TopBar } from "@/components/brutal";
import { MuteToggle } from "@/components/mute-toggle";
import { GeneratorWidget } from "@/components/game/generator-widget";
import { CrossPromo } from "@/components/cross-promo";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";
import type { CategoryId } from "@/lib/types";

export function GeneratorPage({
  category,
  children,
}: {
  category: CategoryId;
  children?: React.ReactNode;
}) {
  const meta = CATEGORIES[category];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: meta.seoTitle,
    url: `${SITE.url}/${meta.seoSlug}`,
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: meta.seoDescription,
  };

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <TopBar back="/" title="Games Paglu" right={<MuteToggle />} />
      <div className="space-y-6 px-4 pb-10">
        <header>
          <h1 className="display text-4xl leading-none">{meta.seoTitle}</h1>
          <p className="mt-2 text-sm font-bold opacity-70">{meta.blurb}</p>
        </header>

        <GeneratorWidget category={category} />

        <div className="space-y-3 text-sm font-medium leading-relaxed opacity-80">
          {children}
        </div>

        <p className="text-xs font-bold opacity-60">
          Or go back to{" "}
          <Link href="/" className="underline decoration-2">
            all the games
          </Link>
          .
        </p>

        <CrossPromo />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
