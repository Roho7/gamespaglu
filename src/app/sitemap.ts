import type { MetadataRoute } from "next";
import { CATEGORY_LIST } from "@/lib/categories";
import { GUIDES } from "@/content/guides";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/scoreboard",
    "/girgit",
    "/how-to-play",
    ...GUIDES.map((g) => `/how-to-play/${g.slug}`),
    ...CATEGORY_LIST.map((c) => `/${c.seoSlug}`),
    ...CATEGORY_LIST.map((c) => `/who-am-i/${c.id}`),
  ];
  return routes.map((route) => ({
    url: `${SITE.url}${route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
