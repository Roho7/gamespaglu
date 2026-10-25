import type { Metadata } from "next";
import { MafiaApp } from "@/components/mafia/mafia-app";
import { pageMetadata } from "@/lib/seo";

/** The ranking page is /how-to-play/mafia. This one exists so a shared link looks right. */
export const metadata: Metadata = pageMetadata({
  title: "Mafia (Werewolf) — the party game with no narrator",
  description:
    "Secret roles, silent nights, loud days. Five to twelve players in one room, one phone each, and nobody has to sit out as narrator. Free, no signup.",
  path: "/mafia/new",
  shareTitle: "Mafia, no narrator needed",
  shareDescription: "Secret roles on every phone. Five to twelve players in the same room.",
});

export default function NewMafiaPage() {
  return <MafiaApp />;
}
