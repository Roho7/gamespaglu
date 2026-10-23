/**
 * Five-ink palettes, one per category. Every palette is a ramp from light to
 * dark and every role is a different ink. Contrast between roles is proven by
 * `npm run check:contrast`.
 *
 * Roles:
 *   base       the paper: label grounds, dithered image backs
 *   highlight  the lightest accent: offset shadow under dark type, image light
 *   secondary  rules and borders
 *   primary    accents and display type: marquee, vine, image ink
 *   shadow     the darkest ink: body text and the band
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
    id: "sage",
    name: "Sage",
    base: "#E1CA96",
    highlight: "#ACA885",
    secondary: "#918B76",
    primary: "#626C66",
    shadow: "#434A42",
  },
  {
    id: "rose",
    name: "Rose",
    base: "#EACBD2",
    highlight: "#DFAEB4",
    secondary: "#BC82A8",
    primary: "#915F88",
    shadow: "#5E4459",
  },
  {
    id: "dusk",
    name: "Dusk",
    base: "#D6DCE4",
    highlight: "#A9B6C6",
    secondary: "#8797AB",
    primary: "#5D6E85",
    shadow: "#3A4657",
  },
  {
    id: "moss",
    name: "Moss",
    base: "#DCE3C8",
    highlight: "#B4C29E",
    secondary: "#93A47E",
    primary: "#667A57",
    shadow: "#41503A",
  },
  {
    id: "clay",
    name: "Clay",
    base: "#EBD3C0",
    highlight: "#D1AD93",
    secondary: "#B88C70",
    primary: "#8C5F48",
    shadow: "#5A3C2E",
  },
  {
    id: "plum",
    name: "Plum",
    base: "#DED3E3",
    highlight: "#BBA9C6",
    secondary: "#9C87AB",
    primary: "#6F5A82",
    shadow: "#463A55",
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

export function paletteVars(c: Palette): React.CSSProperties {
  return {
    ["--cw-base" as string]: c.base,
    ["--cw-highlight" as string]: c.highlight,
    ["--cw-secondary" as string]: c.secondary,
    ["--cw-primary" as string]: c.primary,
    ["--cw-shadow" as string]: c.shadow,
  };
}

export function roundPalette(code: string, roundNo: number): Palette {
  let h = 2166136261;
  for (const ch of `${code}:${roundNo}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return PALETTES[Math.abs(h) % PALETTES.length];
}
