import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";

import type { Graphic } from "../pipeline/schema";
import { BODY, DISPLAY } from "./fonts";
import { ICONS } from "./icons";
import { MIAMI } from "./theme";

type Item = { icon: keyof typeof ICONS; value: string; label: string };

const Entry = ({ item, index, big }: { item: Item; index: number; big: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - index * 8, fps, config: { damping: 13, stiffness: 150 } });
  const Icon = ICONS[item.icon];
  const iconSize = big ? 260 : 120;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: big ? "column" : "row",
        alignItems: "center",
        gap: big ? 40 : 36,
        opacity: pop,
        transform: big ? `scale(${0.6 + pop * 0.4})` : `translateX(${(1 - pop) * -120}px)`,
      }}
    >
      <div
        style={{
          width: iconSize + 60,
          height: iconSize + 60,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: MIAMI.primary,
          color: MIAMI.highlight,
          boxShadow: `10px 10px 0 ${MIAMI.highlight}`,
        }}
      >
        <Icon size={iconSize} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: big ? "center" : "flex-start" }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: big ? (item.value.length > 4 ? 150 : 230) : 130,
            whiteSpace: "nowrap",
            lineHeight: 0.95,
            color: MIAMI.primary,
            textShadow: `${big ? 10 : 6}px ${big ? 10 : 6}px 0 ${MIAMI.highlight}`,
            textTransform: "uppercase",
          }}
        >
          {item.value}
        </div>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: big ? 40 : 34,
            color: MIAMI.shadow,
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

export const Infographic = ({ graphic }: { graphic: Graphic }) => {
  const items: Item[] = graphic.type === "stat" ? [graphic] : graphic.items;
  const big = graphic.type === "stat";
  return (
    <AbsoluteFill
      style={{
        background: MIAMI.base,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        gap: 56,
      }}
    >
      {items.map((item, i) => (
        <Entry key={item.label} item={item} index={i} big={big} />
      ))}
    </AbsoluteFill>
  );
};
