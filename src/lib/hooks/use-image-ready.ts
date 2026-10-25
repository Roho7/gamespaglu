"use client";

import { useEffect, useState } from "react";

const settled = new Map<string, boolean>();

/**
 * True once `src` has loaded. Each path is probed once per page load and remembered, so a missing
 * file is a single 404 rather than one every time a card opens.
 */
export function useImageReady(src: string): boolean {
  const [loaded, setLoaded] = useState(() => settled.get(src) ?? false);
  useEffect(() => {
    if (settled.has(src)) return;
    const img = new Image();
    img.onload = () => {
      settled.set(src, true);
      setLoaded(true);
    };
    img.onerror = () => settled.set(src, false);
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  return loaded && settled.get(src) === true;
}
