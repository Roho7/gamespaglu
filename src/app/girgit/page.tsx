import type { Metadata } from "next";
import { GirgitApp } from "@/components/girgit/girgit-app";
import { SITE } from "@/lib/site";

/**
 * Server wrapper so this route can carry metadata — the game itself is a client
 * component because it holds a socket.
 *
 * The ranking page is /how-to-play/girgit, not this one. Play surfaces are not
 * SEO surfaces; this exists so a shared link looks right, not so it competes.
 */
export const metadata: Metadata = {
  title: "Girgit — the word imposter game",
  description:
    "Sixteen words, one secret, and one player who doesn't know which. Four to ten players, one room code, one phone each. Free, no accounts.",
  alternates: { canonical: `${SITE.url}/girgit` },
  openGraph: {
    title: "Girgit — the word imposter game",
    description:
      "Everyone gets the word. One of you doesn't. Four to ten players in the same room.",
    url: `${SITE.url}/girgit`,
  },
};

export default function GirgitPage() {
  return <GirgitApp />;
}
