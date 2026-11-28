import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

import type { Graphic } from "../pipeline/schema";
import { BODY, DISPLAY } from "./fonts";
import { ICONS } from "./icons";
import { MIAMI, plate } from "./theme";

type Item = { icon: keyof typeof ICONS; value: string; label: string };

const Entry = ({ item, index, big }: { item: Item; index: number; big: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 6 - index * 6, fps, config: { damping: 13, stiffness: 150 } });
  const Icon = ICONS[item.icon];
  const iconSize = big ? 150 : 84;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: big ? "column" : "row",
        alignItems: "center",
        gap: big ? 28 : 32,
        opacity: pop,
        transform: big ? `scale(${0.7 + pop * 0.3})` : `translateX(${(1 - pop) * -80}px)`,
      }}
    >
      <div
        style={{
          width: iconSize + 44,
          height: iconSize + 44,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: MIAMI.shadow,
          color: MIAMI.highlight,
        }}
      >
        <Icon size={iconSize} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: big ? "center" : "flex-start" }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: big ? (item.value.length > 4 ? 130 : 190) : 100,
            whiteSpace: "nowrap",
            lineHeight: 0.95,
            color: MIAMI.highlight,
            textTransform: "uppercase",
          }}
        >
          {item.value}
        </div>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: big ? 38 : 32,
            color: MIAMI.base,
            textTransform: "uppercase",
            letterSpacing: 2,
            textAlign: big ? "center" : "left",
          }}
        >
          {item.label}
        </div>
      </div>
    </div>
  );
};

export const GraphicCard = ({ graphic }: { graphic: Graphic }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const items: Item[] = graphic.type === "stat" ? [graphic] : graphic.items;
  const big = graphic.type === "stat";
  return (
    <AbsoluteFill style={{ background: `${MIAMI.shadow}8C`, opacity: Math.min(1, enter * 1.5) }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 470,
          ...plate(MIAMI.primary, 12),
          padding: big ? "56px 40px 48px" : "44px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: big ? "center" : "stretch",
          gap: 36,
          transform: `translateY(${(1 - enter) * 60}px) scale(${0.92 + enter * 0.08})`,
        }}
      >
        {items.map((item, i) => (
          <Entry key={item.label} item={item} index={i} big={big} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
