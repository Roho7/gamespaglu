import { store } from "./state-adapter";

/**
 * Draw without replacement. Pure random visibly repeats within ~20 draws of a
 * 200-item list and players read that as a bug, so the bucket is a shuffled
 * deck that only reshuffles once it is empty.
 *
 * The bag is keyed by bucket + filter signature: changing the filters is a
 * different deck, so it resets.
 */
export type Bag = { remaining: number[]; size: number };

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawIndex(bagKey: string, size: number): number {
  if (size <= 0) return -1;
  const key = `bag:${bagKey}`;
  let bag = store.get<Bag | null>(key, null);

  if (!bag || bag.size !== size || !Array.isArray(bag.remaining)) {
    bag = { remaining: shuffled(size), size };
  }
  if (bag.remaining.length === 0) {
    bag.remaining = shuffled(size);
  }

  const idx = bag.remaining.pop();
  store.set(key, bag);
  return typeof idx === "number" ? idx : 0;
}

export function bagRemaining(bagKey: string, size: number): number {
  const bag = store.get<Bag | null>(`bag:${bagKey}`, null);
  if (!bag || bag.size !== size) return size;
  return bag.remaining.length === 0 ? size : bag.remaining.length;
}

export function resetBag(bagKey: string) {
  store.remove(`bag:${bagKey}`);
}
