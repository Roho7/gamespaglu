import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import { DISPLAY } from "./fonts";
import { MIAMI } from "./theme";

export const Callout = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 180 } });
  return (
    <div
      style={{
        position: "absolute",
        right: 48,
        top: 64,
        transform: `translateY(${(1 - pop) * -30}px)`,
        opacity: pop,
        background: MIAMI.highlight,
        color: MIAMI.shadow,
        boxShadow: `8px 8px 0 ${MIAMI.secondary}`,
        fontFamily: DISPLAY,
        fontSize: 48,
        letterSpacing: 2,
        padding: "10px 24px 4px",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
};
