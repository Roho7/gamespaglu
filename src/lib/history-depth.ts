let depth = 0;
let lastPath: string | null = null;
let popped = false;

/** Marks the next path change as a browser back or forward, not a new page. */
export function notePopState() {
  popped = true;
}

/**
 * Counts how many pages this tab has moved through inside the app since it
 * landed. A reload or a fresh tab from a shared link starts at zero.
 */
export function recordPath(path: string) {
  if (lastPath === null) {
    lastPath = path;
    return;
  }
  if (path === lastPath) return;
  depth = popped ? Math.max(0, depth - 1) : depth + 1;
  popped = false;
  lastPath = path;
}

/** Whether `router.back()` would land on another page of this app. */
export function hasInAppHistory() {
  return depth > 0;
}
