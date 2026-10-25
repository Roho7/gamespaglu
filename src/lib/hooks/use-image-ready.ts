"use client";

import { useEffect, useState } from "react";

export function useImageReady(src: string): boolean {
  const [loaded, setLoaded] = useState<string | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(src);
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);
  return loaded === src;
}
