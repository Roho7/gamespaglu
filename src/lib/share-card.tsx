import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { ShareCardCopy } from "@/content/share-cards";
import { paletteById, type Palette } from "@/lib/palettes";
import { SITE } from "@/lib/site-config";

/** The size every share card renders at, for `opengraph-image.tsx` routes. */
export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

/** Share cards are PNGs. */
export const SHARE_CARD_TYPE = "image/png";

const fonts = Promise.all([
  readFile(join(process.cwd(), "src/assets/fonts/BebasNeue-Regular.ttf")),
  readFile(join(process.cwd(), "src/assets/fonts/Montserrat-SemiBold.ttf")),
]);

const PHOTO = { width: 430, height: 570, cell: 3 };

function bayer(x: number, y: number) {
  let v = 0;
  for (let bit = 0; bit < 3; bit++) {
    const xb = (x >> bit) & 1;
    const yb = (y >> bit) & 1;
    v |= (((xb ^ yb) << 1) | yb) << (2 * (2 - bit));
  }
  return (v + 0.5) / 64;
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * The photo dithered into the palette the way `DitheredPhoto` does it on the
 * page: an 8x8 ordered dither from `primary` through `base` to `highlight`.
 * The page uses a WebGL shader, which a build has no GPU for.
 */
async function ditheredPhoto(path: string, palette: Palette) {
  const cols = Math.ceil(PHOTO.width / PHOTO.cell);
  const rows = Math.ceil(PHOTO.height / PHOTO.cell);
  const { data } = await sharp(join(process.cwd(), "public", path))
    .resize(cols, rows, { fit: "cover", position: sharp.strategy.attention })
    .normalise()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const inks = [palette.primary, palette.base, palette.highlight].map(rgb);
  const out = Buffer.alloc(cols * rows * 3);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tone = (data[y * cols + x] / 255) * (inks.length - 1);
      const low = Math.floor(tone);
      const pick = Math.min(low + (tone - low > bayer(x, y) ? 1 : 0), inks.length - 1);
      out.set(inks[pick], (y * cols + x) * 3);
    }
  }

  const png = await sharp(out, { raw: { width: cols, height: rows, channels: 3 } })
    .resize(cols * PHOTO.cell, rows * PHOTO.cell, { kernel: "nearest" })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

/**
 * A poster for link previews: the game's dithered photo on the left, its name
 * in display type on the loud ink, and one line of pitch. Same print rules as
 * the site: square edges, one loud ink, one pop ink, near-black.
 */
export async function shareCard({ title, tagline, palette, image }: ShareCardCopy) {
  const ink = paletteById(palette);
  const [[display, body], photo] = await Promise.all([
    fonts,
    ditheredPhoto(image, ink),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: ink.shadow,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: ink.base,
            border: `6px solid ${ink.primary}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            width={PHOTO.width}
            height={PHOTO.height}
            style={{
              width: PHOTO.width,
              height: "100%",
              objectFit: "cover",
              borderRight: `6px solid ${ink.primary}`,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              padding: "44px 48px",
              color: ink.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Body",
                fontSize: 26,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: ink.primary,
              }}
            >
              {SITE.name}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Display",
                fontSize: title.length > 18 ? 96 : title.length > 11 ? 120 : 168,
                lineHeight: 0.9,
                textTransform: "uppercase",
                textShadow: `6px 6px 0 ${ink.highlight}`,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Body",
                fontSize: 34,
                lineHeight: 1.25,
              }}
            >
              {tagline}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts: [
        { name: "Display", data: display, weight: 400, style: "normal" },
        { name: "Body", data: body, weight: 600, style: "normal" },
      ],
    },
  );
}
