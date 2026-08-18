"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * Config and explanations live off-screen. The play surface stays a colour and
 * a button; anything wordy is one tap away behind a gear or a question mark.
 * Content still renders in the DOM, so it remains crawlable and accessible.
 */
export function SideDrawer({
  label,
  icon,
  title,
  children,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerTrigger
        aria-label={label}
        className={cn(
          "press brutal-sm flex size-10 items-center justify-center bg-[var(--paper)] text-lg text-[var(--ink)]",
          className,
        )}
      >
        {icon}
      </DrawerTrigger>
      <DrawerContent
        className="ml-auto h-full w-[min(22rem,88vw)] border-l-2 border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
        style={{ ["--drawer-content-width" as string]: "min(22rem, 88vw)" }}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--line)] px-4 py-3">
          <DrawerTitle className="display text-xl text-[var(--ink)]">
            {title}
          </DrawerTitle>
          <DrawerClose
            aria-label="Close"
            className="press brutal-sm bg-[var(--canvas)] px-2.5 py-1 text-sm font-black text-[var(--ink)]"
          >
            ✕
          </DrawerClose>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
