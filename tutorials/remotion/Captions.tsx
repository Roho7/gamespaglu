import { interpolate, useCurrentFrame } from "remotion";

import { BODY } from "./fonts";
import { MIAMI } from "./theme";

export const Captions = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        top: 1500,
        height: 340,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity,
        color: MIAMI.base,
        fontFamily: BODY,
        fontWeight: 700,
        fontSize: 54,
        lineHeight: 1.25,
      }}
    >
      {text}
    </div>
  );
};
