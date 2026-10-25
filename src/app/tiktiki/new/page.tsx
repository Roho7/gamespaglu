import type { Metadata } from "next";
import { TiktikiApp } from "@/components/tiktiki/tiktiki-app";
import { pageMetadata } from "@/lib/seo";

/** The ranking page is /how-to-play/tiktiki. This one exists so a shared link looks right. */
export const metadata: Metadata = pageMetadata({
  title: "Tiktiki — the Spyfall-style location game",
  description:
    "Everyone knows where you are except the Tiktiki. Ask sneaky questions and catch the lizard on the wall before it guesses the place. Four to twelve players, a phone each. Free, no signup.",
  path: "/tiktiki/new",
  shareTitle: "Tiktiki: who doesn't know where we are?",
  shareDescription: "A secret place on every phone but one. Four to twelve players in the same room.",
});

export default function NewTiktikiPage() {
  return <TiktikiApp />;
}
