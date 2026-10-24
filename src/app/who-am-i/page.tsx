import type { Metadata } from "next";
import { CategoryHeroRail } from "@/components/home/category-hero-rail";
import { PageCorners } from "@/components/layout/page-corners";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Who Am I? — pick what to guess",
  description:
    "The phone-on-forehead guessing game. Pick celebrities, movies, places, animals, objects or numbers, then hold the phone up and let the room describe it.",
  alternates: { canonical: `${SITE.url}/who-am-i` },
};

export default function WhoAmIPage() {
  return (
    <>
      <h1 className="sr-only">Who Am I?</h1>
      <PageCorners back="/" />
      <main className="h-dvh">
        <CategoryHeroRail />
      </main>
    </>
  );
}
