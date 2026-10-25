/**
 * The page transition: every navigation dissolves the old page into the new
 * one through a 4x4 ordered (Bayer) dither, the same print the home photos use.
 *
 * Each frame is a tiled mask. At level k the new page shows through every cell
 * whose Bayer threshold is below k and the old page through the rest, so the
 * two never overlap and never leave a gap. `mask-image` does not interpolate,
 * so the keyframes step through the levels with `step-end`.
 *
 * The class is set on the page boundary by `PageTransition`. Browsers without
 * view transitions swap instantly, and reduced motion drops the animation.
 *
 * React never animates a `popstate`: it commits history traversals
 * synchronously, so the old page is gone before a snapshot could be taken.
 * `ditherBack` covers the in-app back button by starting the transition itself
 * and stepping back inside it; a hardware back or swipe can only be caught
 * after the fact, so `PageTransition` prints the new page in over the ground.
 */
export const DITHER_TRANSITION_CLASS = "dither";

const ROOT_FLAG = "ditherRoot";
const BACK_TIMEOUT_MS = 600;

const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const LEVELS = BAYER_4.length;
const CELL_PX = 4;
const TILE_PX = CELL_PX * 4;
const DURATION_MS = 320;

function maskFrame(show: (threshold: number) => boolean): string {
  const rects = BAYER_4.map((threshold, i) =>
    show(threshold)
      ? `<rect x='${(i % 4) * CELL_PX}' y='${Math.floor(i / 4) * CELL_PX}' width='${CELL_PX}' height='${CELL_PX}'/>`
      : "",
  ).join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE_PX}' height='${TILE_PX}' shape-rendering='crispEdges'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function keyframes(name: string, show: (threshold: number, level: number) => boolean): string {
  const frames = Array.from({ length: LEVELS + 1 }, (_, level) => {
    const at = ((level / LEVELS) * 100).toFixed(2);
    return `${at}%{mask-image:${maskFrame((t) => show(t, level))}}`;
  });
  return `@keyframes ${name}{${frames.join("")}}`;
}

/** True while `ditherBack` owns the transition, so the popstate reveal stands down. */
export function isDitheringBack(): boolean {
  return ROOT_FLAG in document.documentElement.dataset;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Steps back through history inside a dither transition of the whole page.
 * The update waits for the popstate commit, or gives up after a moment when
 * there is no history to go back to.
 */
export function ditherBack(back: () => void): void {
  if (!document.startViewTransition || prefersReducedMotion()) {
    back();
    return;
  }
  const root = document.documentElement;
  root.dataset[ROOT_FLAG] = "";
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const done = () => setTimeout(resolve, 0);
        window.addEventListener("popstate", done, { once: true });
        setTimeout(resolve, BACK_TIMEOUT_MS);
        back();
      }),
  );
  transition.finished.finally(() => delete root.dataset[ROOT_FLAG]);
}

/** The view-transition stylesheet. Rendered once in the root layout. */
export function ditherTransitionCss(): string {
  const c = `.${DITHER_TRANSITION_CLASS}`;
  const root = `html[data-dither-root]`;
  const mask = `mask-size:${TILE_PX}px ${TILE_PX}px;mask-repeat:repeat;mask-position:0 0`;
  const timing = `animation-duration:${DURATION_MS}ms;animation-timing-function:step-end;animation-fill-mode:both`;
  return [
    keyframes("dither-in", (t, level) => t < level),
    keyframes("dither-out", (t, level) => t >= level),
    `::view-transition{pointer-events:none}`,
    `::view-transition-old(root),::view-transition-new(root),::view-transition-group(${c}){animation:none}`,
    `::view-transition-old(${c}),::view-transition-new(${c}),${root}::view-transition-old(root),${root}::view-transition-new(root){mix-blend-mode:normal;${mask};${timing}}`,
    `::view-transition-old(${c}),${root}::view-transition-old(root){animation-name:dither-out}`,
    `::view-transition-new(${c}),${root}::view-transition-new(root){animation-name:dither-in}`,
    `[data-dither-reveal]{${mask};${timing};animation-name:dither-in}`,
    `@media (prefers-reduced-motion:reduce){::view-transition-old(*),::view-transition-new(*),[data-dither-reveal]{animation:none!important}}`,
  ].join("\n");
}
