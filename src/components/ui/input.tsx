import * as React from "react";

import { cn } from "@/lib/utils";

/** Matchbox input: pill, ink rule, kraft field. Colours from tokens only. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-full border-[var(--rule-thin)] border-current bg-[var(--ground-soft)] px-4 py-2.5 text-base font-semibold text-[var(--ground-ink)] outline-none placeholder:opacity-45",
        "focus-visible:outline-[var(--rule)] focus-visible:outline-current",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
