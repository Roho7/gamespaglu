import type { MetadataRoute } from "next";
import { CATEGORY_LIST } from "@/lib/categories";
import { LIVE_GAMES } from "@/lib/games";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    ...LIVE_GAMES.map((g) => g.route),
    ...CATEGORY_LIST.map((c) => `/${c.seoSlug}`),
    ...CATEGORY_LIST.map((c) => `/who-am-i/${c.id}`),
  ];
  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
