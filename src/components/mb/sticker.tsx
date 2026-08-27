"use client";

import { useState } from "react";
import { Emblem } from "@/components/mb/emblems";
import { stickersFor } from "@/lib/stickers";
import { useHydrated } from "@/lib/use-persisted";
import { cn } from "@/lib/utils";
import type { CategoryId } from "@/lib/types";

/**
 * A random local sticker for the category, with the drawn emblem as fallback.
 *
 * The emblem is not decoration — it is what shows when there are no stickers on
 * disk, when a file fails to load, and on the server render. The seed is drawn
 * once per mount but only used after hydration, so the server and the first
 * client render agree and React never has to reconcile a mismatch.
 */
export function Sticker({
  category,
  className,
}: {
  category: CategoryId;
  className?: string;
}) {
  const pool = stickersFor(category);
  const hydrated = useHydrated();
  const [seed] = useState(() => Math.random());
  const [failed, setFailed] = useState(false);

  const sticker =
    hydrated && !failed && pool.length > 0
      ? pool[Math.floor(seed * pool.length) % pool.length]
      : null;

  if (!sticker) {
    return <Emblem category={category} className={className} />;
  }

  return (
    // Animated GIF served from our own public/ directory: next/image would
    // neither optimise it nor preserve the animation, so a plain img is right.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sticker.src}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      className={cn(
        "object-contain drop-shadow-[5px_5px_0_var(--shadow-text,var(--shadow-ink))]",
        className,
      )}
    />
  );
}
