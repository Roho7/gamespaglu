"use client";

import { useState } from "react";
import { MapPinned, X } from "lucide-react";
import { PlaceList } from "@/components/tiktiki/place-list";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import type { PlaceId } from "@shared/protocol";

/**
 * The twelve places this round, behind a corner button. Crossing one out stays on this phone, so
 * you can rule places out as the questions go round. Key it by round so a new deal starts clean.
 */
export function PlacesDrawer({ places }: { places: PlaceId[] }) {
  const [open, setOpen] = useState(false);
  const [crossed, setCrossed] = useState<ReadonlySet<PlaceId>>(new Set());
  const toggle = (id: PlaceId) =>
    setCrossed((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerTrigger aria-label="The places" className="mb-square-btn">
        <MapPinned className="size-5" strokeWidth={2.5} aria-hidden />
      </DrawerTrigger>
      <DrawerContent
        className="mx-auto flex w-full max-w-2xl flex-col border-[length:var(--rule)] border-[var(--ground-ink)] bg-[var(--ground)] text-[var(--ground-ink)]"
        style={{ ["--drawer-content-height" as string]: "86vh" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1">
          <DrawerTitle className="mb-display-sm text-2xl text-[var(--ground-ink)]">The usual suspects</DrawerTitle>
          <DrawerClose aria-label="Close the places" className="mb-square-btn">
            <X className="size-5" strokeWidth={3} aria-hidden />
          </DrawerClose>
        </div>
        <p className="px-4 pb-3 text-sm font-semibold opacity-80">
          We&apos;re at one of these. Tap a place to cross it off. Only you can see your notes.
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <PlaceList places={places} crossed={crossed} onTap={toggle} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
