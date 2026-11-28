import type { Line } from "../pipeline/schema";
import { DISPLAY } from "./fonts";
import { MIAMI, plate } from "./theme";

export const SectionLabel = ({ section }: { section: Line["section"] }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 14, display: "flex", justifyContent: "center" }}>
    <div
      style={{
      ...plate(MIAMI.shadow, 5),
      color: MIAMI.base,
      fontFamily: DISPLAY,
      fontSize: 32,
      lineHeight: 1,
      letterSpacing: 3,
      padding: "7px 14px 4px",
      textTransform: "uppercase",
    }}
  >
      {section}
    </div>
  </div>
);
