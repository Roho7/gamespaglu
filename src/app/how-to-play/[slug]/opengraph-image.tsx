import { notFound } from "next/navigation";
import { SHARE_CARD_SIZE, SHARE_CARD_TYPE, shareCard } from "@/lib/share-card";
import { GAME_SHARE_CARDS } from "@/content/share-cards";
import { GUIDES, getGuide } from "@/content/guides";

export const alt = "How to play, on Games Paglu";
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_TYPE;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide || !(guide.slug in GAME_SHARE_CARDS)) notFound();
  const card = GAME_SHARE_CARDS[guide.slug as keyof typeof GAME_SHARE_CARDS];
  return shareCard({ ...card, title: guide.title });
}
