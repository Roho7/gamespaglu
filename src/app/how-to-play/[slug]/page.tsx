import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCorners } from "@/components/layout/page-corners";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { paletteById, theme } from "@/lib/palettes";
import { CrossPromo } from "@/components/layout/cross-promo";
import { CATEGORIES } from "@/lib/deck/categories";
import { GUIDES, getGuide } from "@/content/guides";
import { SITE } from "@/lib/site-config";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/how-to-play/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.summary },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const cw = paletteById(guide.palette);

  /**
   * Two separate entities, not one.
   *
   * The FAQ used to be hung off the HowTo as `mainEntity`, which is not valid:
   * FAQ rich results require an `FAQPage`, so the FAQPage markup the spec claims
   * to ship was never actually eligible on any guide. An array is legal JSON-LD
   * and keeps both.
   */
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: guide.title,
      description: guide.summary,
      url: `${SITE.url}/how-to-play/${guide.slug}`,
      step: guide.steps.map((s) => ({
        "@type": "HowToStep",
        name: s.title,
        text: s.body,
      })),
    },
  ];
  if (guide.faq?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <main
      {...theme(cw)}
      className="min-h-dvh bg-[var(--cw-base)] text-[var(--cw-shadow)]"
    >
      <PageCorners />

      <article
        className={`mx-auto w-full max-w-2xl space-y-3 px-3 pt-20 ${guide.playRoute ? "pb-36" : "pb-10"}`}
      >
        <header className="mb-tilt space-y-3 px-4 pb-4 text-center">
          <h1 className="mb-display mb-shadow text-5xl leading-none">
            {guide.title}
          </h1>
          <p className="mb-caps flex flex-wrap justify-center gap-x-4 gap-y-1 text-[1rem] opacity-80">
            <span>{guide.players} players</span>
            <span>{guide.needs}</span>
          </p>
          {guide.alsoCalled?.length ? (
            <p className="font-sans uppercase font-medium text-sm opacity-60">
              Also called {guide.alsoCalled.join(" · ")}
            </p>
          ) : null}
        </header>

        <StitchedPanel title="The game">
          <div className="space-y-3 text-base leading-relaxed font-medium">
            {guide.intro.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </StitchedPanel>

        <StitchedPanel title="The rules">
          <ol className="space-y-5">
            {guide.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="mb-display-sm w-6 shrink-0 text-3xl leading-none">
                  {i + 1}
                </span>
                <div>
                  <h3 className="mb-display-sm text-xl">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed font-medium opacity-85">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </StitchedPanel>

        {guide.variations?.length ? (
          <StitchedPanel title="Ways to play it">
            <ul className="space-y-4">
              {guide.variations.map((v) => (
                <li key={v.title}>
                  <h3 className="mb-display-sm text-xl">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed font-medium opacity-85">
                    {v.body}
                  </p>
                </li>
              ))}
            </ul>
          </StitchedPanel>
        ) : null}

        {guide.categories?.length ? (
          <StitchedPanel title="Pick a category">
            <ul className="grid grid-cols-2 gap-2">
              {guide.categories.map((id) => {
                const c = CATEGORIES[id];
                return (
                  <li key={id}>
                    <Link
                      href={`/who-am-i/${id}`}
                      {...theme(c.palette)}
                      className="mb-label mb-display-sm group relative block p-4 text-center text-2xl"
                    >
                      <StitchBorder variant="link" className="inset-1.5" />
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </StitchedPanel>
        ) : null}

        {guide.faq?.length ? (
          <StitchedPanel title="Questions people ask">
            <dl className="space-y-4">
              {guide.faq.map((f) => (
                <div key={f.q}>
                  <dt className="mb-display-sm text-xl">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed font-medium opacity-85">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </StitchedPanel>
        ) : null}

        {guide.credits?.length ? (
          <StitchedPanel title="Photo credits">
            <ul className="space-y-1 text-sm font-medium opacity-85">
              {guide.credits.map((c) => (
                <li key={c.href}>
                  {c.label}:{" "}
                  <a href={c.href} target="_blank" rel="noreferrer" className="underline decoration-2">
                    {c.author}
                  </a>
                  , {c.license}
                </li>
              ))}
            </ul>
          </StitchedPanel>
        ) : null}

        <CrossPromo />
      </article>

      {guide.playRoute ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex">
          <Link href={guide.playRoute} className="mb-band-action flex-1 py-8">
            <StitchBorder className="inset-3" />
            <span className="mb-display-sm text-4xl">Play it now</span>
          </Link>
        </div>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
