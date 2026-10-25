import Link from "next/link";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import { HelpLink } from "@/components/layout/page-corners";
import { PixelChevron } from "@/components/stitch/pixel-chevron";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { paletteById, type PaletteId, theme } from "@/lib/palettes";

/** One line of the poster lockup over the photo. */
export type PosterRow = { text: string; kind: "title" | "subtitle" };

const ROW_SIZE: Record<PosterRow["kind"], string> = {
  title: "text-[min(40vw,15rem)]",
  subtitle: "text-[min(15vw,7rem)]",
};

/**
 * A full-screen home section for a game: the picture dithered in the game's
 * palette, up to three poster rows overlaid on it (left, right, left), a "?"
 * to its guide in the corner, and the band that starts it. Built like the
 * category rail cards so every game on home reads as the same kind of thing.
 */
export function HomeGameCard({
  href,
  help,
  palette: paletteId,
  title,
  tagline,
  image,
  rows,
  more = false,
}: {
  href: string;
  help: string;
  palette: PaletteId;
  title: string;
  tagline: string;
  image?: string;
  rows: [PosterRow, PosterRow?, PosterRow?];
  /** Another game waits below, so the card says to swipe down. */
  more?: boolean;
}) {
  const palette = paletteById(paletteId);
  return (
    <section
      {...theme(palette)}
      className="mb-label mb-label-bleed h-full snap-start"
    >
      <div className="relative flex min-h-0 flex-1 flex-col items-center px-6 pb-6 text-center">
        {image ? (
          <DitheredPhoto
            image={image}
            palette={palette}
            className="absolute inset-0"
          />
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-14 flex flex-col px-2 text-[var(--cw-base)] mix-blend-overlay"
        >
          {rows.map((row, i) =>
            row ? (
              <span
                key={i}
                className={`font-[family-name:var(--font-poster)] leading-[0.82] uppercase ${ROW_SIZE[row.kind]} ${i === 1 ? "self-end" : "self-start"}`}
              >
                {row.text}
              </span>
            ) : null,
          )}
        </div>
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
