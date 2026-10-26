"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { BandButton } from "@/components/layout/band-button";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import type { Palette } from "@/lib/palettes";

/**
 * The band's Accuse action. It opens a sheet of everyone else at the table; pick one and put them
 * on trial. Once you've had your shot this round, the band says so instead.
 */
export function AccuseDrawer({
  suspects,
  palette,
  used,
  onAccuse,
}: {
  suspects: { id: string; name: string; away: boolean }[];
  palette: Palette;
  used: boolean;
  onAccuse: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  if (used) {
    return (
      <BandButton onClick={() => undefined} disabled detail="You've had your shot. Let someone else point fingers.">
        Accuse
      </BandButton>
    );
  }

  const slips: SeatSlip[] = suspects.map((s) => ({
    id: s.id,
    name: s.name,
    away: s.away,
    open: true,
    selected: chosen === s.id,
  }));

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="down">
      <DrawerTrigger className="mb-band-action flex-1 py-10">
        <StitchBorder dithered className="inset-3" />
        <span className="mb-display-sm inline-flex items-center gap-2 text-4xl">Accuse</span>
        <span className="mb-caps text-sm">One shot a round. Make it count.</span>
      </DrawerTrigger>
      <DrawerContent
        className="mx-auto flex w-full max-w-2xl flex-col border-[length:var(--rule)] border-[var(--ground-ink)] bg-[var(--ground)] text-[var(--ground-ink)]"
        style={{ ["--drawer-content-height" as string]: "86vh" }}
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <DrawerTitle className="mb-display-sm text-2xl text-[var(--ground-ink)]">Who&apos;s the Tiktiki?</DrawerTitle>
          <DrawerClose aria-label="Never mind" className="mb-square-btn">
            <X className="size-5" strokeWidth={3} aria-hidden />
          </DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <SeatBoard slips={slips} palette={palette} onSelect={setChosen} />
        </div>
        <div className="mb-band relative flex">
          <BandButton
            onClick={() => {
              if (!chosen) return;
              setOpen(false);
              onAccuse(chosen);
            }}
            disabled={!chosen}
            detail={chosen ? "Everyone else votes. It has to be unanimous." : "Tap a face first"}
          >
            Put them on trial
          </BandButton>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
