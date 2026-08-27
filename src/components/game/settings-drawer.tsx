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
          "text-base font-extrabold active:translate-y-[1px]",
          className,
        )}
      >
        {icon}
      </DrawerTrigger>
      <DrawerContent
        className="ml-auto h-full w-[min(22rem,88vw)] rounded-l-[var(--radius-2xl)] border-[var(--rule)] border-[var(--ground-ink)] bg-[var(--ground)] text-[var(--ground-ink)]"
        style={{ ["--drawer-content-width" as string]: "min(22rem, 88vw)" }}
      >
        <div className="flex items-center justify-between gap-3 border-b-[var(--rule-thin)] border-current px-4 py-3">
          <DrawerTitle className="mb-display-sm text-xl text-[var(--ground-ink)]">
            {title}
          </DrawerTitle>
          <DrawerClose
            aria-label="Close"
            className="mb-icon-btn"
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
