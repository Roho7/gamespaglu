const SKIPPED = new Set(["style", "scoreboard"]);

let slide: string | null = null;


export function homeSlideForPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const head = parts[0];
  if (!head) return null;
  if (head === "how-to-play") {
    const slug = parts[1];
    if (!slug || slug === "scoreboard") return null;
    return slug;
  }
  if (head.startsWith("random-") && head.endsWith("-generator")) return "who-am-i";
  if (SKIPPED.has(head)) return null;
  return head;
}

/** The home card id for a card's play link. */
export function homeSlideForHref(href: string): string {
  return homeSlideForPath(href.split("?")[0] ?? href) ?? "";
}

/** Remember the game the player is in, so home can reopen on its poster. */
export function rememberHomeSlide(pathname: string) {
  const next = homeSlideForPath(pathname);
  if (next) slide = next;
}

/** The poster to reopen, or null on a fresh visit. */
export function savedHomeSlide(): string | null {
  return slide;
}
