"use client";

import { useState } from "react";
import { Trophy, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RoomScoreboard } from "@/components/scoreboard/room-scoreboard";
import { Scoreboard } from "@/components/scoreboard/scoreboard";
import type { PublicPlayer } from "@shared/protocol";


export function ScoreboardDrawer({ room }: { room?: PublicPlayer[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerTrigger aria-label="Open scoreboard" className="mb-square-btn">
        <Trophy className="size-5" strokeWidth={2.5} aria-hidden />
      </DrawerTrigger>
      <DrawerContent
        className="mx-auto flex w-full max-w-2xl flex-col border-[length:var(--rule)] border-[var(--ground-ink)] bg-[var(--ground)] text-[var(--ground-ink)]"
        style={{ ["--drawer-content-height" as string]: "86vh" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <DrawerTitle className="mb-display-sm text-2xl text-[var(--ground-ink)]">
            Scoreboard
          </DrawerTitle>
          <DrawerClose aria-label="Close scoreboard" className="mb-square-btn">
            <X className="size-5" strokeWidth={3} aria-hidden />
          </DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {room ? <RoomScoreboard players={room} /> : <Scoreboard />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
