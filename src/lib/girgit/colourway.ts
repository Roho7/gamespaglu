import { COLOURWAYS, type Colourway } from "@/lib/colourways";

/**
 * The round's colourway, derived from the room code and round number rather
 * than drawn at random.
 *
 * Everyone is sitting at one table looking at each other's phones. If each
 * device picked its own colour the room would look like four different games,
 * and — worse — a phone that reconnected would visibly change colour mid-round,
 * which reads as something having gone wrong. A pure function of shared state
 * means every screen agrees without anything extra crossing the wire.
 */
export function roundColourway(code: string, roundNo: number): Colourway {
  let h = 2166136261;
  for (const ch of `${code}:${roundNo}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return COLOURWAYS[Math.abs(h) % COLOURWAYS.length];
}
