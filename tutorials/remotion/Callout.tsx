import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import { DISPLAY } from "./fonts";
import { MIAMI, plate } from "./theme";

export const Callout = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 13, stiffness: 190 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 1450,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(1, pop * 2),
        transform: `scale(${0.7 + pop * 0.3})`,
      }}
    >
      <div
        style={{
          ...plate(MIAMI.primary, 10),
          color: MIAMI.highlight,
          fontFamily: DISPLAY,
          fontSize: 84,
          lineHeight: 1,
          letterSpacing: 3,
          padding: "16px 36px 8px",
          textTransform: "uppercase",
          textAlign: "center",
          maxWidth: 940,
        }}
      >
        {text}
      </div>
    </div>
  );
};
