import { SHARE_CARD_SIZE, SHARE_CARD_TYPE, shareCard } from "@/lib/share-card";
import { SITE_SHARE_CARD } from "@/content/share-cards";

export const alt = "Games Paglu: party games for a room full of people";
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_TYPE;

export default function Image() {
  return shareCard(SITE_SHARE_CARD);
}
