/**
 * A fresh pastel for every draw.
 *
 * Fixed per-category colours meant six people holding up phones in a circle all
 * showed the same wall of lavender. Randomising per generation makes the room
 * look like a room.
 *
 * Generated rather than picked from a list, so the variety is effectively
 * infinite, but constrained so every result is genuinely pastel:
 *   - lightness stays high, which guarantees dark ink on top stays readable
 *     (>9:1 against --on-accent) without a per-colour contrast check
 *   - saturation stays mid, so nothing turns neon or muddy
 *   - consecutive draws are forced apart on the hue wheel, because two
 *     near-identical pinks in a row read as "it didn't change"
 */
export type Pastel = { css: string; hue: number };

const MIN_HUE_GAP = 48;

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function randomPastel(previousHue?: number): Pastel {
  let hue = Math.floor(Math.random() * 360);
  if (typeof previousHue === "number") {
    // A handful of tries is plenty; the gap is a preference, not a guarantee.
    for (let i = 0; i < 12 && hueDistance(hue, previousHue) < MIN_HUE_GAP; i++) {
      hue = Math.floor(Math.random() * 360);
    }
  }
  const saturation = 58 + Math.random() * 20; // 58–78%
  const lightness = 80 + Math.random() * 7; // 80–87%
  return {
    css: `hsl(${hue} ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`,
    hue,
  };
}
