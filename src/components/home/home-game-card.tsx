import Link from "next/link";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import { HelpLink } from "@/components/layout/page-corners";
import { SiteLogo } from "@/components/layout/site-logo";
import { PixelChevron } from "@/components/stitch/pixel-chevron";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { homeSlideForHref } from "@/lib/home-slide";
import { paletteById, type PaletteId, theme } from "@/lib/palettes";

export type PosterRow = { text: string; kind: "title" | "subtitle" };

const ROW_SIZE: Record<PosterRow["kind"], string> = {
  title: "text-[min(40vw,15rem)] lg:text-[min(24vw,23rem)]",
  subtitle: "text-[min(15vw,7rem)] lg:self-end! lg:absolute lg:top-2",
};


export function HomeGameCard({
  href,
  help,
  palette: paletteId,
  title,
  tagline,
  image,
  rows,
  more = false,
  originY,
}: {
  href: string;
  help: string;
  palette: PaletteId;
  title: string;
  tagline: string;
  image?: string;
  rows: [PosterRow, PosterRow?, PosterRow?];
  more?: boolean;
  originY?: number;
}) {
  const palette = paletteById(paletteId);
  return (
    <section
      {...theme(palette)}
      data-home-slide={homeSlideForHref(href)}
      className="mb-label mb-label-bleed h-full snap-start"
    >
      <div className="relative flex min-h-0 flex-1 flex-col items-center px-6 pb-6 text-center">
        {image ? (
          <DitheredPhoto
            image={image}
            palette={palette}
            originY={originY}
            className="absolute inset-0"
          />
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-16 flex flex-col px-2 text-[var(--cw-ink)] mix-blend-overlay"
        >
          {rows.map((row, i) =>
            row ? (
              <span
                key={i}
                className={`font-[family-name:var(--font-poster)] leading-[0.82] uppercase ${ROW_SIZE[row.kind]} ${i === 1 ? "self-end lg:self-start" : "self-start"}`}
              >
                {row.text}
              </span>
            ) : null,
          )}
        </div>
        <SiteLogo className="absolute top-3 left-3" />
        <HelpLink href={help} className="absolute top-3 right-3" />
        {more ? (
          <PixelChevron
            direction="down"
            className="absolute bottom-5 left-1/2 w-10 -translate-x-1/2 text-[var(--cw-highlight)]"
          />
        ) : null}
      </div>
      <Link href={href} className="mb-band-action p-10">
        <StitchBorder className="inset-3" />
        <span className="text-sm font-light text-center">{tagline}</span>
        <span className="mb-display-sm text-5xl">{title}</span>
      </Link>
    </section>
  );
}
