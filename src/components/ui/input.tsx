import * as React from "react";

import { StitchBorder } from "@/components/stitch/stitch-border";
import { cn } from "@/lib/utils";

/**
 * A square field in its palette's dark ink with the loud ink as type, so it
 * takes the colours of whatever it sits in, framed by the small bud stitch
 * around its outer edge. `className` styles the frame, and the input inherits
 * its type, alignment and spacing, so a caller can set `text-center text-2xl`.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <span
      className={cn(
        "relative block w-full min-w-0 bg-[var(--cw-primary)] text-base font-semibold text-[var(--loud)] focus-within:outline-[length:var(--rule)] focus-within:outline-current",
        className,
      )}
    >
      <input
        type={type}
        data-slot="input"
        className="w-full min-w-0 bg-transparent px-4 py-3 [font:inherit] [letter-spacing:inherit] [text-align:inherit] text-inherit outline-none placeholder:opacity-45"
        {...props}
      />
      <StitchBorder variant="field" className="inset-0" />
    </span>
  );
}

export { Input };
