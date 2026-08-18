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
 * Keeping score is not a destination — it happens *during* a game. So the
 * scorecard is a bottom sheet reachable from the app bar on every screen,
 * rather than a page you have to leave the game to visit.
 *
 * The board itself is the same persisted state as /scoreboard, so a score
 * added here is the same score there.
 */
export function ScoreboardDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerTrigger
        aria-label="Open scorecard"
        className="press flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-bold text-[var(--ink)]"
      >
        <span aria-hidden>🏆</span>
        Score
      </DrawerTrigger>
      {/* base-ui drives the sheet height from --drawer-content-height, so a
          height class alone is ignored. */}
      <DrawerContent
        className="mx-auto flex w-full max-w-2xl flex-col rounded-t-[26px] border-2 border-[var(--line)] bg-[var(--canvas)] text-[var(--ink)]"
        style={{ ["--drawer-content-height" as string]: "86vh" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <DrawerTitle className="display text-2xl text-[var(--ink)]">
            Scorecard
          </DrawerTitle>
          <DrawerClose
            aria-label="Close scorecard"
            className="press flex size-9 items-center justify-center rounded-full border-2 border-[var(--line)] bg-[var(--paper)] text-sm font-bold text-[var(--ink)]"
          >
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
