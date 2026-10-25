import { SHARE_CARD_SIZE, SHARE_CARD_TYPE, shareCard } from "@/lib/share-card";
import { GAME_SHARE_CARDS } from "@/content/share-cards";
import { CATEGORIES } from "@/lib/deck/categories";

const meta = CATEGORIES["number"];

export const alt = meta.seoTitle;
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_TYPE;

export default function Image() {
  return shareCard({
    title: meta.seoTitle,
    tagline: meta.blurb,
    palette: meta.palette,
    image: meta.background ?? GAME_SHARE_CARDS["who-am-i"].image,
  });
}
