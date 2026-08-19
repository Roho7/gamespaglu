import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Matchbox button. One structure everywhere — outer rule, field, dotted inner
 * rule — with hierarchy carried entirely by palette (see .mb-btn-* recipes in
 * globals.css). That way the ladder still reads in greyscale.
 *
 * Colours come from colourway tokens only. Never add a colour class here.
 */
const buttonVariants = cva("mb-btn disabled:pointer-events-none", {
  variants: {
    variant: {
      primary: "mb-btn-primary",
      secondary: "mb-btn-secondary",
      tertiary: "mb-btn-tertiary",
      // Aliases so shadcn's own components keep working unchanged.
      outline: "mb-btn-secondary",
      ghost: "mb-btn-tertiary [&::after]:hidden border-transparent",
      destructive: "mb-btn-primary",
      link: "mb-btn-tertiary [&::after]:hidden border-transparent underline",
    },
    size: {
      sm: "px-4 py-1.5 text-sm [&::after]:inset-[4px]",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-3.5 text-xl",
      hero: "w-full px-8 py-4 text-2xl",
      icon: "size-9 p-0 [&::after]:hidden",
      "icon-sm": "size-8 p-0 text-sm [&::after]:hidden",
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
