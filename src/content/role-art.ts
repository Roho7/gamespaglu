import type { MafiaRole } from "@shared/protocol";

/**
 * The photo on each Mafia role card. Drop a JPEG at the path and the card dithers it into the
 * phase's inks; until then it shows the drawn emblem. PNGs run through `npm run backgrounds`.
 */
export const ROLE_ART: Record<MafiaRole, string> = {
  mafia: "/roles/mafia.jpg",
  doctor: "/roles/doctor.jpg",
  villager: "/roles/villager.jpg",
};
