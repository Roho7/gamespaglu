import { AbsoluteFill, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

import type { Segment } from "./data";
import { XFADE_FRAMES } from "./theme";

const Clip = ({ segment, file, fadeIn }: { segment: Segment; file: string; fadeIn: boolean }) => {
  const frame = useCurrentFrame();
  const opacity = fadeIn ? interpolate(frame, [0, XFADE_FRAMES], [0, 1], { extrapolateRight: "clamp" }) : 1;
  const frozen = frame >= segment.footageFrames;
  return (
    <AbsoluteFill style={{ opacity }}>
      <Freeze frame={Math.min(frame, segment.footageFrames)} active={frozen}>
        <OffthreadVideo
          src={staticFile(`capture/${file}`)}
          startFrom={segment.footageStartFrame}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Freeze>
    </AbsoluteFill>
  );
};

export const Footage = ({ segments, file }: { segments: Segment[]; file: string }) => (
  <AbsoluteFill>
    {segments.map((segment, i) => (
      <Sequence
        key={`${segment.shot}-${segment.startFrame}`}
        from={segment.startFrame}
        durationInFrames={segment.frames + (i < segments.length - 1 ? XFADE_FRAMES : 0)}
        layout="none"
      >
        <Clip segment={segment} file={file} fadeIn={i > 0} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
