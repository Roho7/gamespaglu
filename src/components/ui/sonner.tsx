"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * shadcn's toaster with Sonner's own styling switched off and replaced by the
 * print set: a square slip in the loud ink, the same hard shadow as the
 * square buttons, dropped below the corner buttons so it never covers them.
 * Mounted once in the root layout; call `toast()` anywhere.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      offset="4.5rem"
      mobileOffset="4.5rem"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 border-[length:var(--rule-thin)] border-[var(--on-loud)] bg-[var(--loud)] px-4 py-3 text-sm font-semibold text-[var(--on-loud)] shadow-[4px_4px_0_0_var(--on-loud)]",
          title: "font-semibold",
        },
      }}
      {...props}
    />
  );
}
