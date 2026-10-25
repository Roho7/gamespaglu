"use client";

import { useEffect, useRef, ViewTransition } from "react";
import {
  DITHER_TRANSITION_CLASS,
  isDitheringBack,
  prefersReducedMotion,
} from "@/lib/dither-transition";

/**
 * The boundary every navigation dithers across. It sits in the root layout,
 * which persists, so a route change is an update to it rather than an
 * enter/exit. One wrapping element keeps the page a single snapshot, so the
 * old and new masks line up.
 *
 * A hardware back or swipe arrives as a popstate React will not animate, so
 * the new page dithers in over the ground instead, unless the browser is
 * already playing its own swipe animation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const page = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = page.current;
    if (!el) return;
    const clear = () => el.removeAttribute("data-dither-reveal");
    const settle = (event: AnimationEvent) => {
      if (event.target === el) clear();
    };
    const reveal = (event: PopStateEvent) => {
      if (isDitheringBack() || event.hasUAVisualTransition || prefersReducedMotion()) return;
      clear();
      void el.offsetWidth;
      el.setAttribute("data-dither-reveal", "");
    };
    window.addEventListener("popstate", reveal);
    el.addEventListener("animationend", settle);
    return () => {
      window.removeEventListener("popstate", reveal);
      el.removeEventListener("animationend", settle);
    };
  }, []);

  return (
    <ViewTransition default={DITHER_TRANSITION_CLASS}>
      <div ref={page} className="flex flex-1 flex-col">
        {children}
      </div>
    </ViewTransition>
  );
}
