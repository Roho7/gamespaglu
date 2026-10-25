import type { Metadata } from "next";
import { TiktikiApp } from "@/components/tiktiki/tiktiki-app";
import { SITE } from "@/lib/site-config";

/** The ranking page is /how-to-play/tiktiki. This one exists so a shared link looks right. */
export const metadata: Metadata = {
  title: "Tiktiki — the spy-in-the-room location game",
  description:
    "Everyone knows where you are except the Tiktiki. Ask sneaky questions, catch the lizard on the wall. Four to twelve players, one phone each. Free, no accounts.",
  alternates: { canonical: `${SITE.url}/tiktiki/new` },
  openGraph: {
    title: "Tiktiki — who doesn't know where we are?",
    description: "A secret place on every phone but one. Four to twelve players in the same room.",
    url: `${SITE.url}/tiktiki/new`,
  },
};

export default function NewTiktikiPage() {
  return <TiktikiApp />;
}
