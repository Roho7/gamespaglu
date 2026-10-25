import { SHARE_CARD_SIZE, SHARE_CARD_TYPE, shareCard } from "@/lib/share-card";
import { GUIDES_SHARE_CARD } from "@/content/share-cards";

export const alt = "How to play every game on Games Paglu";
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_TYPE;

export default function Image() {
  return shareCard(GUIDES_SHARE_CARD);
}
