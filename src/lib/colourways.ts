/**
 * Matchbox colourways.
 *
 * A label is never one colour — it's three or four spot inks that work
 * together. So a draw picks a whole approved set, not a random hue: that way
 * every combination on screen is one a human already looked at, and contrast is
 * verified up front by `npm run check:contrast`.
 *
 * Roles:
 *   field     the printed ground of the label
 *   frame     the outer rule and the dotted inner rule
 *   ink       body and UI text on the field (must clear 4.5:1)
 *   highlight accents, marquee, caption text (large bold only, >= 3:1)
 */
export type Colourway = {
  id: string;
  name: string;
  field: string;
  frame: string;
  ink: string;
  highlight: string;
  /**
   * The offset shadow behind display type and emblems. Must contrast with
   * `ink`: on a light-ink colourway it's near-black, but on a dark-ink one
   * (mustard) a dark shadow disappears and the glyph reads as embossed mud.
   */
  shadow: string;
};

export const COLOURWAYS: Colourway[] = [
  {
    id: "pillar",
    name: "Pillar red",
    field: "#C6202A",
    frame: "#F5C518",
    ink: "#FFF8E7",
    highlight: "#F5C518",
    shadow: "#17110C",
  },
  {
    id: "saffron",
    name: "Saffron",
    field: "#AE5409",
    frame: "#FFE9A8",
    ink: "#FFF8E7",
    highlight: "#FFE9A8",
    shadow: "#17110C",
  },
  {
    id: "indigo",
    name: "Ink blue",
    field: "#1F4E9C",
    frame: "#F5C518",
    ink: "#FFF8E7",
    highlight: "#F5C518",
    shadow: "#17110C",
  },
  {
    id: "bottle",
    name: "Bottle green",
    field: "#12684A",
    frame: "#F5C518",
    ink: "#FFF8E7",
    highlight: "#F5C518",
    shadow: "#17110C",
  },
  {
    id: "magenta",
    name: "Magenta",
    field: "#A81757",
    frame: "#F5C518",
    ink: "#FFF8E7",
    highlight: "#FFD9E6",
    shadow: "#17110C",
  },
  {
    id: "maroon",
    name: "Maroon",
    field: "#7A1520",
    frame: "#E2A200",
    ink: "#FFF1CF",
    highlight: "#E2A200",
    shadow: "#17110C",
  },
  {
    id: "teal",
    name: "Peacock",
    field: "#0E6A73",
    frame: "#F5C518",
    ink: "#FFF8E7",
    highlight: "#FFC9A8",
    shadow: "#17110C",
  },
  {
    id: "aubergine",
    name: "Aubergine",
    field: "#4A2585",
    frame: "#F5C518",
    ink: "#FFF8E7",
    highlight: "#9BE0F5",
    shadow: "#17110C",
  },
  {
    id: "mustard",
    name: "Mustard",
    field: "#E2A200",
    frame: "#8E1119",
    ink: "#2A1206",
    highlight: "#8E1119",
    shadow: "#FFF1CF",
  },
  {
    id: "vermilion",
    name: "Vermilion",
    field: "#C2360F",
    frame: "#FFF1CF",
    ink: "#FFF8E7",
    highlight: "#FFF1CF",
    shadow: "#17110C",
  },
];

export const DEFAULT_COLOURWAY = COLOURWAYS[0];

export function colourwayById(id: string | undefined) {
  return COLOURWAYS.find((c) => c.id === id) ?? DEFAULT_COLOURWAY;
}

/**
 * Every draw recolours the screen. Fixed colour meant six people in a circle
 * holding up identical labels; a fresh colourway per draw makes the room look
 * like a room. Never repeats the previous one.
 */
export function randomColourway(previousId?: string): Colourway {
  const pool =
    COLOURWAYS.length > 1 && previousId
      ? COLOURWAYS.filter((c) => c.id !== previousId)
      : COLOURWAYS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Inline style object that scopes a colourway to a subtree. */
export function colourwayVars(c: Colourway): React.CSSProperties {
  return {
    ["--field" as string]: c.field,
    ["--frame" as string]: c.frame,
    ["--ink-on-field" as string]: c.ink,
    ["--highlight" as string]: c.highlight,
    ["--shadow-text" as string]: c.shadow,
  };
}
