import { notFound } from "next/navigation";
import { SHARE_CARD_SIZE, SHARE_CARD_TYPE, shareCard } from "@/lib/share-card";
import { GAME_SHARE_CARDS } from "@/content/share-cards";
import { CATEGORIES, CATEGORY_ORDER, isCategoryId } from "@/lib/deck/categories";

export const alt = "Who Am I? on Games Paglu";
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_TYPE;

export function generateStaticParams() {
  return CATEGORY_ORDER.map((category) => ({ category }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategoryId(category)) notFound();
  const meta = CATEGORIES[category];
  return shareCard({
    title: `Who Am I? ${meta.label}`,
    tagline: meta.blurb,
    palette: meta.palette,
    image: meta.background ?? GAME_SHARE_CARDS["who-am-i"].image,
  });
}
