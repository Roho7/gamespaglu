import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppBar } from "@/components/app-bar";
import { colourwayById, colourwayVars } from "@/lib/colourways";
import { CrossPromo } from "@/components/cross-promo";
import { CATEGORIES } from "@/lib/categories";
import { GUIDES, getGuide } from "@/content/guides";
import { SITE } from "@/lib/site";

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

  const cw = colourwayById(guide.colourway);

  const jsonLd = {
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
    ...(guide.faq?.length
      ? {
          mainEntity: guide.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : {}),
  };

  return (
    <main className="mx-auto w-full max-w-2xl flex-1" style={colourwayVars(cw)}>
      <AppBar back="/how-to-play" title="How to play" />

      <article className="space-y-8 px-4 pb-12">
        <header className="mb-frame mb-tilt rounded-[var(--radius-lg)] p-5">
          <span className="text-4xl" aria-hidden>
            {guide.emoji}
          </span>
          <h1 className="mb-display mt-2 text-3xl">{guide.title}</h1>
          <div className="mb-caps mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.6rem] opacity-80">
            <span>{guide.players} players</span>
            <span>{guide.time}</span>
            <span>{guide.needs}</span>
          </div>
        </header>

        {guide.alsoCalled?.length ? (
          <p className="mb-caps text-[0.6rem] opacity-60">
            Also called: {guide.alsoCalled.join(" · ")}
          </p>
        ) : null}

        <div className="space-y-4 text-base leading-relaxed opacity-85">
          {guide.intro.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        {guide.playRoute ? (
          <Link
            href={guide.playRoute}
            className="mb-btn mb-btn-primary w-full text-xl"
          >
            Play it now →
          </Link>
        ) : null}

        <section className="space-y-5">
          <h2 className="mb-display-sm text-2xl">
            {guide.status === "planned" ? "The plan" : "The rules"}
          </h2>
          <ol className="space-y-4">
            {guide.steps.map((s, i) => (
              <li key={s.title} className="rounded-[var(--radius-lg)] border-[var(--rule-thin)] border-current bg-[var(--ground-soft)] p-4">
                <div className="flex items-baseline gap-3">
                  <span className="mb-frame [--dot-radius:9999px] shrink-0 rounded-full px-3 py-0.5 text-lg font-extrabold">
                    {i + 1}
                  </span>
                  <h3 className="mb-display-sm text-lg">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {guide.variations?.length ? (
          <section className="space-y-5">
            <h2 className="mb-display-sm text-2xl">Ways to play it</h2>
            <ul className="space-y-4">
              {guide.variations.map((v) => (
                <li key={v.title} className="border-l-[var(--rule)] border-current pl-4">
                  <h3 className="mb-display-sm text-lg">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed opacity-80">
                    {v.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {guide.categories?.length ? (
          <section className="space-y-3">
            <h2 className="mb-display-sm text-2xl">Pick a category</h2>
            <ul className="grid grid-cols-2 gap-2">
              {guide.categories.map((id) => {
                const c = CATEGORIES[id];
                return (
                  <li key={id}>
                    <Link
                      href={`/who-am-i/${id}`}
                      className="mb-frame [--dot-radius:calc(var(--radius-md)-var(--dot-inset))] flex items-center gap-2 rounded-[var(--radius-md)] p-3 text-sm font-bold"
                      style={colourwayVars(colourwayById(c.colourway))}
                    >
                      <span aria-hidden>{c.emoji}</span>
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {guide.faq?.length ? (
          <section className="space-y-4">
            <h2 className="mb-display-sm text-2xl">Questions people ask</h2>
            <dl className="space-y-4">
              {guide.faq.map((f) => (
                <div key={f.q} className="rounded-[var(--radius-lg)] border-[var(--rule-thin)] border-current bg-[var(--ground-soft)] p-4">
                  <dt className="mb-display-sm text-base">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed opacity-80">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <CrossPromo />
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
