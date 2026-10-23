import Link from "next/link";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { paletteById, paletteVars, type PaletteId } from "@/lib/palettes";

/**
 * A full-screen home section for a game: the picture dithered in the game's
 * palette, anything extra on the field, and the band that starts it. Built
 * like the category rail cards so every game on home reads as the same kind
 * of thing.
 */
export function HomeGameCard({
  href,
  palette: paletteId,
  title,
  tagline,
  image,
  children,
}: {
  href: string;
  palette: PaletteId;
  title: string;
  tagline: string;
  image?: string;
  children?: React.ReactNode;
}) {
  const palette = paletteById(paletteId);
  return (
    <section
      style={paletteVars(palette)}
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
        {children}
      </div>
      <Link href={href} className="mb-band-action p-10">
        <StitchBorder className="inset-3" />
        <span className="text-sm font-light">{tagline}</span>
        <span className="mb-display-sm text-5xl">{title}</span>
      </Link>
    </section>
  );
}
