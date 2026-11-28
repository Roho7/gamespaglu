import type { Metadata } from "next";
import { SecretHitlerApp } from "@/components/secret-hitler/secret-hitler-app";
import { pageMetadata } from "@/lib/seo";

/** The ranking page is /how-to-play/secret-hitler. This one exists so a shared link looks right. */
export const metadata: Metadata = pageMetadata({
  title: "Secret Hitler — the hidden role game, one phone each",
  description:
    "Liberals, Fascists and one secret Hitler. Five to ten players in one room, a phone each for your secret role and your policies, and one shared board. Free, no signup.",
  path: "/secret-hitler/new",
  shareTitle: "Secret Hitler, a phone each",
  shareDescription: "Secret roles on every phone, one shared board. Five to ten players in the same room.",
});

export default function NewSecretHitlerPage() {
  return <SecretHitlerApp />;
}
