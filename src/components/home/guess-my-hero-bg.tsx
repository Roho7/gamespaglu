import { ImageDithering } from "@paper-design/shaders-react";
import type { Colourway } from "@/lib/colors/colourways";
import { cn } from "@/lib/utils";

/**
 * The category's photo dithered into its palette: base is the paper, primary
 * the ink, highlight the light tones. Fills its parent.
 */
const GuessMyHeroBg = ({
  image,
  colourway,
  className,
}: {
  image: string;
  colourway: Colourway;
  className?: string;
}) => {
  return (
    <ImageDithering
      width="100%"
      height="100%"
      className={cn("pointer-events-none", className)}
      image={image}
      colorBack={colourway.primary}
      colorFront={colourway.base}
      colorHighlight={colourway.highlight}
      originalColors={false}
      inverted={false}
      type="8x8"
      size={2}
      colorSteps={2}
      fit="cover"
    />
  );
};

export default GuessMyHeroBg;
