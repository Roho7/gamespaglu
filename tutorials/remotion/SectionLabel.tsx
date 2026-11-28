import { DISPLAY } from "./fonts";
import { plate, usePalette } from "./theme";

export const SectionLabel = ({ label }: { label: string }) => {
  const palette = usePalette();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 14, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          ...plate(palette, palette.shadow, 5),
          color: palette.base,
          fontFamily: DISPLAY,
          fontSize: 32,
          lineHeight: 1,
          letterSpacing: 3,
          padding: "7px 14px 4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};
