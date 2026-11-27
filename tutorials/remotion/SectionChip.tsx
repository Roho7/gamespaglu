import { interpolate, useCurrentFrame } from "remotion";

import type { Line } from "../pipeline/schema";
import { BODY, DISPLAY } from "./fonts";
import { MIAMI } from "./theme";

export const SectionChip = ({ section, title }: { section: Line["section"]; title: string }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 56,
        opacity,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          alignSelf: "flex-start",
          background: MIAMI.highlight,
          color: MIAMI.shadow,
          fontFamily: DISPLAY,
          fontSize: 46,
          letterSpacing: 2,
          padding: "6px 18px 2px",
          textTransform: "uppercase",
        }}
      >
        {section}
      </div>
      <div
        style={{
          color: MIAMI.base,
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
    </div>
  );
};
