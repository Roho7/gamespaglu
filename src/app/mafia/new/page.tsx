import type { Metadata } from "next";
import { MafiaApp } from "@/components/mafia/mafia-app";
import { SITE } from "@/lib/site-config";

/** The ranking page is /how-to-play/mafia. This one exists so a shared link looks right. */
export const metadata: Metadata = {
  title: "Mafia — the party game, no narrator needed",
  description:
    "Secret roles, silent nights, loud days. Five to twelve players in one room, one phone each, and nobody has to sit out as narrator. Free, no accounts.",
  alternates: { canonical: `${SITE.url}/mafia/new` },
  openGraph: {
    title: "Mafia — no narrator needed",
    description: "Secret roles on every phone. Five to twelve players in the same room.",
    url: `${SITE.url}/mafia/new`,
  },
};

export default function NewMafiaPage() {
  return <MafiaApp />;
}
