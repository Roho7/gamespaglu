import type { Metadata } from "next";
import { CategoryHeroRail } from "@/components/home/category-hero-rail";
import { AppBar } from "@/components/layout/app-bar";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Heads Up — pick what to guess",
  description:
    "The phone-on-forehead guessing game. Pick celebrities, movies, places, animals, objects or numbers, then hold the phone up and let the room describe it.",
  alternates: { canonical: `${SITE.url}/headsup` },
};

export default function HeadsUpPage() {
  return (
    <>
      <AppBar back="/" title="Heads Up" titleHidden />
      <main className="h-dvh">
        <CategoryHeroRail />
      </main>
    </>
  );
}
