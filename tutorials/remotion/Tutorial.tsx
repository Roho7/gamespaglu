import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";

import { Captions } from "./Captions";
import type { TutorialProps } from "./Root";
import { Scene } from "./Scene";
import { SectionChip } from "./SectionChip";
import { MIAMI } from "./theme";

export const Tutorial = ({ data }: TutorialProps) => {
  if (!data) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: MIAMI.shadow }}>
      {data.lines.map((timed) => (
        <Sequence key={timed.line.id} from={timed.startFrame} durationInFrames={timed.frames}>
          <Scene timed={timed} footageFile={data.footageFile} />
          <SectionChip section={timed.line.section} title={data.dialogue.title} />
          <Captions text={timed.line.text} />
          {timed.audioFile ? <Audio src={staticFile(`audio/${timed.audioFile}`)} /> : null}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
