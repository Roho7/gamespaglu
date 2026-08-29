import type { CategoryId } from "./types";

/**
 * Every game is a manifest. Home renders from this registry, so adding Secret
 * Hitler later means adding an entry — not editing the home page.
 */
export type GameManifest = {
  id: string;
  name: string;
  route: string;
  tagline: string;
  emoji: string;
  accentVar: string;
  minPlayers: number;
  /** True once a game needs a room: a socket server and a shared code. */
  needsRoom: boolean;
  status: "live" | "planned";
  categories?: CategoryId[];
};

export const GAMES: GameManifest[] = [
  {
    id: "who-am-i",
    name: "Who Am I?",
    route: "/who-am-i/celebrity",
    tagline: "Phone on your forehead. Everyone else can see it. You can't.",
    emoji: "🙈",
    accentVar: "--cat-celebrity",
    minPlayers: 3,
    needsRoom: false,
    status: "live",
    categories: ["celebrity", "movie", "place", "animal", "object", "number"],
  },
  {
    id: "girgit",
    name: "Girgit",
    route: "/girgit",
    tagline: "Everyone gets the word. One of you doesn't, and doesn't know it.",
    emoji: "🦎",
    accentVar: "--cat-place",
    minPlayers: 4,
    // The first one. Rooms are no longer hypothetical.
    needsRoom: true,
    status: "live",
  },
  {
    id: "scoreboard",
    name: "Scoreboard",
    route: "/scoreboard",
    tagline: "Keep score for any game on earth. Cards, carrom, antakshari.",
    emoji: "🏆",
    accentVar: "--cat-number",
    minPlayers: 2,
    needsRoom: false,
    status: "live",
  },
];

export const LIVE_GAMES = GAMES.filter((g) => g.status === "live");
