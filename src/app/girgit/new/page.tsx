import type { Metadata } from "next";
import { GirgitApp } from "@/components/girgit/girgit-app";
import { pageMetadata } from "@/lib/seo";

/**
 * Server wrapper so this route can carry metadata — the game itself is a client
 * component because it holds a socket.
 *
 * The ranking page is /how-to-play/girgit, not this one. Play surfaces are not
 * SEO surfaces; this exists so a shared link looks right, not so it competes.
 */
export const metadata: Metadata = pageMetadata({
  title: "Girgit — the Chameleon word imposter game",
  description:
    "Sixteen words, one secret, and one Girgit who doesn't know which. Everyone gives a clue, the table argues, then votes. Four to ten players in one room, a phone each. Free, no signup.",
  path: "/girgit/new",
  shareTitle: "Girgit: find the chameleon",
  shareDescription:
    "Find the imposter who doesn't know the word. Four to ten players in the same room.",
});

export default function NewGirgitPage() {
  return <GirgitApp />;
}
