/**
 * Five-ink palettes in the manner of an 80s movie poster. Each category owns
 * one; the rest join the random draws in the generator and Girgit rounds. Each is
 * one loud ink, a second pop ink, and near-black. Every role is a different
 * ink, and contrast between roles is proven by `npm run check:contrast`.
 *
 * Roles:
 *   base       the loud ink: label grounds, the bright tones of a photo
 *   highlight  the pop ink: offset shadow under dark type, photo highlights
 *   secondary  rules and borders
 *   primary    dark ink: accents, display type, vine, photo shadows
 *   shadow     near-black: body text and the band
 */
export type Palette = {
  id: PaletteId;
  name: string;
  base: string;
  highlight: string;
  secondary: string;
  primary: string;
  shadow: string;
};

const PALETTE_DEFINITIONS = [
  {
    id: "pulp",
    name: "Pulp",
    base: "#F2B23E",
    highlight: "#E88BA6",
    secondary: "#C2603A",
    primary: "#3B3631",
    shadow: "#1C1A18",
  },
  {
    id: "neon",
    name: "Neon",
    base: "#3FD9C6",
    highlight: "#FF5FA2",
    secondary: "#1F8A8C",
    primary: "#1E2A4A",
    shadow: "#0E1324",
  },
  {
    id: "jungle",
    name: "Jungle",
    base: "#BFE05A",
    highlight: "#FFD23F",
    secondary: "#4E9A3A",
    primary: "#1F3B2A",
    shadow: "#0F1D14",
  },
  {
    id: "flamingo",
    name: "Flamingo",
    base: "#FF8FB1",
    highlight: "#FFD1A1",
    secondary: "#C9336B",
    primary: "#4A1E3A",
    shadow: "#230E1C",
  },
  {
    id: "tangerine",
    name: "Tangerine",
    base: "#FF7A2F",
    highlight: "#FFD84D",
    secondary: "#B8341A",
    primary: "#3A1F14",
    shadow: "#1C0F0A",
  },
  {
    id: "arcade",
    name: "Arcade",
    base: "#B98CFF",
    highlight: "#5CE1FF",
    secondary: "#7A4FE0",
    primary: "#22184A",
    shadow: "#100B26",
  },
  {
    id: "cherry",
    name: "Cherry",
    base: "#FF4D5E",
    highlight: "#FFE3A3",
    secondary: "#A81A2E",
    primary: "#3D1218",
    shadow: "#1A0709",
  },
  {
    id: "miami",
    name: "Miami",
    base: "#5EC8FF",
    highlight: "#FFE066",
    secondary: "#1F7FC2",
    primary: "#102A4C",
    shadow: "#07142A",
  },
  {
    id: "lemon",
    name: "Lemon",
    base: "#FFE14D",
    highlight: "#FF6F91",
    secondary: "#B58A00",
    primary: "#2E2A12",
    shadow: "#15130A",
  },
  {
    id: "mint",
    name: "Mint",
    base: "#7CF2B0",
    highlight: "#FF9E6D",
    secondary: "#2EA36B",
    primary: "#123A2B",
    shadow: "#081C14",
  },
  {
    id: "cobalt",
    name: "Cobalt",
    base: "#4F7BFF",
    highlight: "#FFB547",
    secondary: "#2A3FB0",
    primary: "#141B47",
    shadow: "#0A0D24",
  },
] as const;

export type PaletteId = (typeof PALETTE_DEFINITIONS)[number]["id"];

export const PALETTES: readonly Palette[] = PALETTE_DEFINITIONS;

const DEFAULT_PALETTE = PALETTES[0];

export function paletteById(id: string | undefined) {
  return PALETTES.find((c) => c.id === id) ?? DEFAULT_PALETTE;
}

export function randomPalette(previousId?: string): Palette {
  const pool =
    PALETTES.length > 1 && previousId
      ? PALETTES.filter((c) => c.id !== previousId)
      : PALETTES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** The palette every plain page is printed in. */
export const GROUND = paletteById("miami");

/**
 * Prints an element in a palette: spread it onto the element
 * (`<div {...theme("jungle")}>`) and every `--cw-*` recipe inside follows.
 * `flipped` is for a dark field: the colourway inverts so type and rules print
 * light, while `--loud` keeps the loud ink so primary actions stay the
 * brightest thing there. The CSS behind it is generated once by
 * `paletteCss()`, so no element carries an inline colour.
 */
export function theme(
  palette: Palette | PaletteId,
  { flipped = false }: { flipped?: boolean } = {},
) {
  return {
    "data-palette": typeof palette === "string" ? palette : palette.id,
    ...(flipped ? { "data-flipped": "" } : {}),
  };
}

function inks(p: Palette, flipped: boolean) {
  const [base, shadow] = flipped ? [p.shadow, p.base] : [p.base, p.shadow];
  return [
    `--cw-base:${base}`,
    `--cw-highlight:${p.highlight}`,
    `--cw-secondary:${p.secondary}`,
    `--cw-primary:${p.primary}`,
    `--cw-shadow:${shadow}`,
    `--loud:${p.base}`,
    `--on-loud:${p.shadow}`,
  ].join(";");
}

/**
 * The stylesheet behind `theme()`: one rule per palette and one for its
 * flipped form, plus the ground tokens. A flipped field sets its colour again
 * because children inherit the computed colour, not the variable. Rendered
 * once in the root layout.
 */
export function paletteCss(): string {
  const n = parseInt(GROUND.shadow.slice(1), 16);
  const ground = [
    `--ground:${GROUND.shadow}`,
    `--ground-soft:${GROUND.primary}`,
    `--ground-ink:${GROUND.base}`,
    `--ground-muted:${GROUND.highlight}`,
    `--scrim:rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255} / 0.7)`,
  ].join(";");
  return [
    `:root{${ground}}`,
    ...PALETTES.flatMap((p) => [
      `[data-palette="${p.id}"]{${inks(p, false)}}`,
      `[data-palette="${p.id}"][data-flipped]{${inks(p, true)};color:var(--cw-shadow)}`,
    ]),
  ].join("\n");
}

export function roundPalette(code: string, roundNo: number): Palette {
  let h = 2166136261;
  for (const ch of `${code}:${roundNo}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return PALETTES[Math.abs(h) % PALETTES.length];
}
