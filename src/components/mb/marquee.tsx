import { cn } from "@/lib/utils";

/**
 * The starburst stamp. Fill comes from currentColor so it recolours with the
 * colourway — never hardcode the yellow.
 *
 * House rule: at most one marquee per screen, and only behind the hero
 * (central emblem or the drawn word). Scarcity is what keeps it feeling like a
 * stamp instead of wallpaper.
 */
export function Marquee({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 169 169"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none", className)}
    >
      <path
        fill="currentColor"
        d="M84.333 0L91.8841 24.7266L105.347 2.65472L106.512 28.4824L125.041 10.4521L119.746 35.7579L142.177 22.9021L130.755 46.0962L155.679 39.2226L138.847 58.8474L164.697 58.3881L143.514 73.2106L168.666 79.1942L144.463 88.283L167.336 100.334L141.633 103.118L160.791 120.478L135.202 116.783L149.441 138.362L125.576 128.419L134.001 152.862L113.358 137.296L115.44 163.066L99.3162 142.856L94.9237 168.334L84.333 144.749L73.7423 168.334L69.3498 142.856L53.2265 163.066L55.3081 137.296L34.6652 152.862L43.0901 128.419L19.2246 138.362L33.4635 116.783L7.87512 120.478L27.0333 103.118L1.32973 100.334L24.2034 88.283L-0.00025177 79.1942L25.1517 73.2106L3.96873 58.3881L29.8185 58.8474L12.9873 39.2226L37.9107 46.0962L26.4888 22.9021L48.9198 35.7579L43.6248 10.4521L62.1541 28.4824L63.3187 2.65472L76.7819 24.7266L84.333 0Z"
      />
    </svg>
  );
}
