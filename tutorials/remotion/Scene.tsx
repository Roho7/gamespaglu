import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

import { Callout } from "./Callout";
import type { TimedLine } from "./data";
import { Infographic } from "./Infographic";
import { PHONE, PHONE_BORDER } from "./layout";
import { MIAMI } from "./theme";

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: "absolute",
      left: PHONE.x - PHONE_BORDER,
      top: PHONE.y - PHONE_BORDER,
      width: PHONE.width + PHONE_BORDER * 2,
      height: PHONE.height + PHONE_BORDER * 2,
      boxSizing: "border-box",
      border: `${PHONE_BORDER}px solid ${MIAMI.base}`,
      boxShadow: `14px 14px 0 ${MIAMI.highlight}`,
      background: MIAMI.shadow,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

const Footage = ({ timed, file }: { timed: TimedLine; file: string }) => {
  const frame = useCurrentFrame();
  const last = timed.footageFrames === null ? Infinity : timed.footageFrames;
  return (
    <Freeze frame={Math.min(frame, last)} active={frame >= last}>
      <OffthreadVideo
        src={staticFile(`capture/${file}`)}
        startFrom={timed.footageStartFrame}
        muted
        style={{ width: PHONE.width, height: PHONE.height, objectFit: "cover", display: "block" }}
      />
    </Freeze>
  );
};

export const Scene = ({ timed, footageFile }: { timed: TimedLine; footageFile: string }) => {
  const { scene } = timed.line;
  return (
    <AbsoluteFill>
      <Frame>
        {scene.kind === "footage" ? (
          <Footage timed={timed} file={footageFile} />
        ) : (
          <Infographic graphic={scene.graphic} />
        )}
      </Frame>
      {scene.kind === "footage" && scene.callout ? <Callout text={scene.callout} /> : null}
    </AbsoluteFill>
  );
};
