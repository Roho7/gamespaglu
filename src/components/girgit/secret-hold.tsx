"use client";

import { useState } from "react";

/**
 * Press and hold to see your word.
 *
 * This is the one piece of Girgit that is genuinely ours rather than ported,
 * and it exists because our players are shoulder to shoulder while the online
 * clones' players are in different rooms.
 *
 * Two rules, both load-bearing:
 *
 * 1. The grid never highlights. A lit cell transmits its answer by POSITION —
 *    readable at a glance, at an angle, in peripheral vision, without reading a
 *    single word. Type in a fixed slot has to actually be read.
 * 2. The Girgit's screen behaves identically. If holding did nothing for them,
 *    a neighbour watching a press-and-hold produce no change would have them
 *    instantly. Same slot, same size, same shape of block.
 */
export function SecretHold({
  word,
  isGirgit,
}: {
  /** The secret word, or null when this player is the Girgit. */
  word: string | null;
  isGirgit: boolean;
}) {
  const [held, setHeld] = useState(false);
  const release = () => setHeld(false);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        className="mb-btn mb-btn-secondary mb-no-dots w-full max-w-sm px-6 py-2.5 text-base select-none"
        onPointerDown={() => setHeld(true)}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        // A long press otherwise raises the OS text-selection menu, which
        // covers the very thing you are holding the button to read.
        onContextMenu={(e) => e.preventDefault()}
      >
        {held ? "Let go" : "Hold to see your word"}
      </button>

      {/* Fixed height whether it shows a word, the Girgit line, or nothing, so
          the layout never twitches and gives away that anything happened. */}
      <p
        aria-live="polite"
        className="mb-display-sm flex min-h-9 items-center justify-center text-center text-lg"
      >
        {held ? (isGirgit ? "You're the Girgit" : word) : " "}
      </p>
    </div>
  );
}
