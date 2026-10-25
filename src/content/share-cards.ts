import type { PaletteId } from "@/lib/palettes";

/** What a link to one game looks like when it is pasted into a chat. */
export type ShareCardCopy = {
  title: string;
  tagline: string;
  palette: PaletteId;
  image: string;
};

/**
 * One card per game, shared by its play page and its guide, so a link to
 * either looks like the same game.
 */
export const GAME_SHARE_CARDS = {
  wavelength: {
    title: "Wavelength",
    tagline: "Do you share the same vibe? One clue, one dial, one phone.",
    palette: "miami",
    image: "/backgrounds/wavelength.jpg",
  },
  "who-am-i": {
    title: "Who Am I?",
    tagline: "Phone on forehead. The whole room knows who you are, except you.",
    palette: "tangerine",
    image: "/backgrounds/who-am-i.jpg",
  },
  girgit: {
    title: "Girgit",
    tagline: "Sixteen words, one secret, and one chameleon bluffing through it.",
    palette: "jungle",
    image: "/backgrounds/chameleon.jpg",
  },
  mafia: {
    title: "Mafia",
    tagline: "Secret roles on every phone. No narrator. Trust nobody.",
    palette: "cherry",
    image: "/backgrounds/mafia-1.jpg",
  },
  tiktiki: {
    title: "Tiktiki",
    tagline: "Everyone knows where you are, except the lizard on the wall.",
    palette: "arcade",
    image: "/backgrounds/tiktiki.jpg",
  },
  scoreboard: {
    title: "Scoreboard",
    tagline: "Retire the back of the envelope. Tap to score, any game, any table.",
    palette: "flamingo",
    image: "/backgrounds/numbers-1.jpg",
  },
} satisfies Record<string, ShareCardCopy>;

/** The card for the home page and anything that is the whole site. */
export const SITE_SHARE_CARD: ShareCardCopy = {
  title: "Games Paglu",
  tagline: "Party games for a room full of people. Your phone does the boring bits.",
  palette: "miami",
  image: "/backgrounds/wavelength.jpg",
};

/** The card for the guide index. */
export const GUIDES_SHARE_CARD: ShareCardCopy = {
  title: "How to play",
  tagline: "Rules, tactics and house variations for every game at the table.",
  palette: "pulp",
  image: "/backgrounds/who-am-i.jpg",
};
