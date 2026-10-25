"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { rememberHomeSlide, savedHomeSlide } from "@/lib/home-slide";

export function HomeSlideMemory() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    rememberHomeSlide(pathname);
  }, [pathname]);
  return null;
}

export function HomeRail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const rail = ref.current;
    const slide = savedHomeSlide();
    if (!rail || !slide) return;
    const card = rail.querySelector<HTMLElement>(
      `[data-home-slide="${CSS.escape(slide)}"]`,
    );
    if (!card) return;
    const top =
      card.getBoundingClientRect().top -
      rail.getBoundingClientRect().top +
      rail.scrollTop;
    rail.scrollTop = top;
  }, []);

  return (
    <main
      ref={ref}
      className="h-dvh snap-y snap-mandatory overflow-x-hidden overflow-y-auto"
    >
      {children}
    </main>
  );
}
