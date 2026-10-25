import type { Metadata } from "next";
import { CategoryHeroRail } from "@/components/home/category-hero-rail";
import { PageCorners } from "@/components/layout/page-corners";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Who Am I? — the Heads Up game on your phone",
  description:
    "Phone on your forehead, a name on the screen, and the room answers yes or no. Pick celebrities, movies, places, animals, objects or numbers. Free, offline, no signup.",
  path: "/who-am-i",
});

export default function WhoAmIPage() {
  return (
    <>
      <h1 className="sr-only">Who Am I?</h1>
      <PageCorners />
      <main className="h-dvh">
        <CategoryHeroRail />
      </main>
    </>
  );
}
