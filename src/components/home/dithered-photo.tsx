import { ImageDithering } from "@paper-design/shaders-react";
import type { Palette } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/**
 * The category's photo dithered into its palette: base is the paper, primary
 * the ink, highlight the light tones. Fills its parent.
 */
export function DitheredPhoto({
  image,
  palette,
  className,
  originY,
}: {
  image: string;
  palette: Palette;
  className?: string;
  /** 0.5 centers the crop. -0.5 pins the top of the photo to the top of the frame. */
  originY?: number;
}) {
  return (
    <ImageDithering
      width="100%"
      height="100%"
      className={cn("pointer-events-none", className)}
      image={image}
      colorBack={palette.primary}
      colorFront={palette.base}
      colorHighlight={palette.highlight}
      originalColors={false}
      inverted={false}
      type="8x8"
      size={1.5}
      colorSteps={2}
      fit="cover"
      originY={originY}
    />
  );
}
