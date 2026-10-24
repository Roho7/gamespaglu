import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Matchbox button. The same square, solid, hard-shadowed shape as the corner
 * `.mb-square-btn`, with hierarchy carried entirely by palette (see .mb-btn-*
 * recipes in globals.css). That way the ladder still reads in greyscale.
 *
 * Colours come from palette tokens only. Never add a colour class here.
 */
const buttonVariants = cva("mb-btn disabled:pointer-events-none", {
  variants: {
    variant: {
      primary: "mb-btn-primary",
      secondary: "mb-btn-secondary",
      tertiary: "mb-btn-tertiary",
      outline: "mb-btn-secondary",
      ghost: "mb-btn-tertiary border-transparent shadow-none",
      destructive: "mb-btn-primary",
      link: "mb-btn-tertiary border-transparent shadow-none underline",
    },
    size: {
      sm: "px-4 py-1.5 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-3.5 text-xl",
      hero: "w-full px-8 py-4 text-2xl",
      icon: "size-9 p-0",
      "icon-sm": "size-8 p-0 text-sm",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
