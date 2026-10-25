import { SHARE_CARD_SIZE, SHARE_CARD_TYPE, shareCard } from "@/lib/share-card";
import { GAME_SHARE_CARDS } from "@/content/share-cards";

export const alt = "Mafia on Games Paglu";
export const size = SHARE_CARD_SIZE;
export const contentType = SHARE_CARD_TYPE;

export default function Image() {
  return shareCard(GAME_SHARE_CARDS["mafia"]);
}
