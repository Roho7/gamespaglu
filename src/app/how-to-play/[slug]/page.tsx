import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrutalButton, TopBar } from "@/components/brutal";
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

  const accent = `var(${guide.accentVar})`;

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
    <main
      className="mx-auto w-full max-w-2xl flex-1"
      style={{ ["--accent-flood" as string]: accent }}
    >
      <TopBar back="/how-to-play" title="How to play" />

      <article className="space-y-8 px-4 pb-12">
        <header
          className="brutal p-5 text-[var(--on-accent)]"
          style={{ background: accent }}
        >
          <span className="text-4xl" aria-hidden>
            {guide.emoji}
          </span>
          <h1 className="display mt-2 text-3xl leading-none">{guide.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold uppercase tracking-wide opacity-70">
            <span>{guide.players} players</span>
            <span>{guide.time}</span>
            <span>{guide.needs}</span>
          </div>
        </header>

        {guide.alsoCalled?.length ? (
          <p className="text-xs font-bold uppercase tracking-wide opacity-55">
            Also called: {guide.alsoCalled.join(" · ")}
          </p>
        ) : null}

        <div className="space-y-4 text-base leading-relaxed opacity-85">
          {guide.intro.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        {guide.playRoute ? (
          <Link href={guide.playRoute} className="block">
            <BrutalButton variant="accent" size="xl" className="text-2xl">
              Play it now →
            </BrutalButton>
          </Link>
        ) : null}

        <section className="space-y-5">
          <h2 className="display text-2xl">
            {guide.status === "planned" ? "The plan" : "The rules"}
          </h2>
          <ol className="space-y-4">
            {guide.steps.map((s, i) => (
              <li key={s.title} className="brutal bg-[var(--paper)] p-4">
                <div className="flex items-baseline gap-3">
                  <span
                    className="display shrink-0 px-2 text-lg text-[var(--on-accent)]"
                    style={{ background: accent }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="display text-lg leading-tight">{s.title}</h3>
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
            <h2 className="display text-2xl">Ways to play it</h2>
            <ul className="space-y-4">
              {guide.variations.map((v) => (
                <li key={v.title} className="border-l-4 border-[var(--line)] pl-4">
                  <h3 className="display text-lg">{v.title}</h3>
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
            <h2 className="display text-2xl">Pick a category</h2>
            <ul className="grid grid-cols-2 gap-2">
              {guide.categories.map((id) => {
                const c = CATEGORIES[id];
                return (
                  <li key={id}>
                    <Link
                      href={`/who-am-i/${id}`}
                      className="press brutal-sm flex items-center gap-2 p-3 text-sm font-bold text-[var(--on-accent)]"
                      style={{ background: `var(${c.accentVar})` }}
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
            <h2 className="display text-2xl">Questions people ask</h2>
            <dl className="space-y-4">
              {guide.faq.map((f) => (
                <div key={f.q} className="brutal bg-[var(--paper)] p-4">
                  <dt className="display text-base">{f.q}</dt>
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
