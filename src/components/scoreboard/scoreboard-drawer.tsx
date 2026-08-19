"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Scoreboard } from "@/components/scoreboard/scoreboard";

/**
 * Keeping score happens *during* a game, so the scorecard is a bottom sheet
 * reachable from the app bar on every screen rather than a page you leave the
 * game to visit. Same persisted board as /scoreboard.
 */
export function ScoreboardDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerTrigger
        aria-label="Open scorecard"
        className="mb-btn mb-btn-secondary px-3.5 py-1.5 text-xs"
      >
        <span aria-hidden>🏆</span>
        Score
      </DrawerTrigger>
      {/* base-ui drives the sheet height from --drawer-content-height, so a
          height class alone is ignored. Opaque ground: a translucent sheet over
          a saturated label is unreadable. */}
      <DrawerContent
        className="mx-auto flex w-full max-w-2xl flex-col rounded-t-[var(--radius-2xl)] border-[var(--rule)] border-[var(--ground-ink)] bg-[var(--ground)] text-[var(--ground-ink)]"
        style={{ ["--drawer-content-height" as string]: "86vh" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <DrawerTitle className="mb-display-sm text-2xl text-[var(--ground-ink)]">
            Scorecard
          </DrawerTitle>
          <DrawerClose aria-label="Close scorecard" className="mb-icon-btn">
            ✕
          </DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <Scoreboard />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
