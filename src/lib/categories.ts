import type { CategoryId } from "./types";

export type CategoryMeta = {
  id: CategoryId;
  /** What the tile says. */
  label: string;
  /** Used in copy: "Guess your {noun}". */
  noun: string;
  emoji: string;
  /** Colourway id owning this category's picker card and idle screen. */
  colourway: string;
  /** Standalone SEO route. */
  seoSlug: string;
  seoTitle: string;
  seoDescription: string;
  /** Does the country picker apply? */
  hasRegionFilter: boolean;
  /** Do the Indian-language sub-chips apply? Only film data carries a language. */
  hasLanguageFilter: boolean;
  /** Do the kind-of-famous chips and the era toggle apply? */
  hasTypeFilter: boolean;
  hasRangeFilter: boolean;
  blurb: string;
};

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  celebrity: {
    id: "celebrity",
    label: "Celebrity",
    noun: "celebrity",
    emoji: "🕶️",
    colourway: "pillar",
    seoSlug: "random-celebrity-generator",
    seoTitle: "Random Celebrity Generator",
    seoDescription:
      "Pick a random famous name — actors, cricketers, singers, leaders, YouTubers, cartoon characters, anime characters and superheroes. Filter by country, kind and era. Free and offline.",
    hasRegionFilter: true,
    hasLanguageFilter: true,
    hasTypeFilter: true,
    hasRangeFilter: false,
    blurb:
      "Actors, cricketers, singers, leaders, YouTubers — plus cartoons, anime and superheroes. Filter by who, where and which era.",
  },
  movie: {
    id: "movie",
    label: "Movie",
    noun: "movie",
    emoji: "🎬",
    colourway: "indigo",
    seoSlug: "random-movie-generator",
    seoTitle: "Random Movie Generator",
    seoDescription:
      "Get a random movie — Bollywood, Tamil, Telugu, Malayalam, Kannada, Hollywood, Korean or Japanese. Filter by country and language. Free and offline.",
    hasRegionFilter: true,
    hasLanguageFilter: true,
    hasTypeFilter: false,
    hasRangeFilter: false,
    blurb:
      "Bollywood to Hollywood, with Tamil, Telugu, Malayalam and Kannada as their own switches. Titles everyone knows, not festival deep cuts.",
  },
  place: {
    id: "place",
    label: "Place",
    noun: "place",
    emoji: "🗺️",
    colourway: "bottle",
    seoSlug: "random-place-generator",
    seoTitle: "Random Place Generator",
    seoDescription:
      "Random famous places — landmarks, cities and countries. Filter by region, including a strong Indian list. Free, no signup, works offline.",
    hasRegionFilter: true,
    hasLanguageFilter: false,
    hasTypeFilter: false,
    hasRangeFilter: false,
    blurb:
      "Landmarks, cities and countries — the kind where “am I in Asia?” and “do tourists go there?” both work as questions.",
  },
  animal: {
    id: "animal",
    label: "Animal",
    noun: "animal",
    emoji: "🐘",
    colourway: "mustard",
    seoSlug: "random-animal-generator",
    seoTitle: "Random Animal Generator",
    seoDescription:
      "Draw a random animal from a curated list of creatures everyone can name. Free, no signup, works offline. Great for charades and Who Am I?",
    hasRegionFilter: false,
    hasLanguageFilter: false,
    hasTypeFilter: false,
    hasRangeFilter: false,
    blurb:
      "Everything from dog to platypus. Nothing from a taxonomy textbook.",
  },
  object: {
    id: "object",
    label: "Object",
    noun: "object",
    emoji: "🪑",
    colourway: "teal",
    seoSlug: "random-object-generator",
    seoTitle: "Random Object Generator",
    seoDescription:
      "Random everyday objects — from toothbrush to pressure cooker. A curated, desi-inclusive list. Free, no signup, works offline.",
    hasRegionFilter: false,
    hasLanguageFilter: false,
    hasTypeFilter: false,
    hasRangeFilter: false,
    blurb:
      "Everyday things you can point at. Toothbrush, ceiling fan, pressure cooker, cricket bat.",
  },
  number: {
    id: "number",
    label: "Number",
    noun: "number",
    emoji: "🔢",
    colourway: "aubergine",
    seoSlug: "random-number-generator",
    seoTitle: "Random Number Generator",
    seoDescription:
      "A fast random number generator with 1–10, 1–50, 1–100 and 1–1000 presets plus any custom range. No repeats until the range is used up. Free and offline.",
    hasRegionFilter: false,
    hasLanguageFilter: false,
    hasTypeFilter: false,
    hasRangeFilter: true,
    blurb:
      "1 to 100 by default. Tap a preset or set your own range. No repeats until the range runs out.",
  },
};

export const CATEGORY_ORDER: CategoryId[] = [
  "celebrity",
  "movie",
  "place",
  "animal",
  "object",
  "number",
];

export const CATEGORY_LIST = CATEGORY_ORDER.map((id) => CATEGORIES[id]);

export function isCategoryId(v: string): v is CategoryId {
  return v in CATEGORIES;
}
