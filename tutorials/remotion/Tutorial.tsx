import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";

import { Callout } from "./Callout";
import { Captions } from "./Captions";
import { Footage } from "./Footage";
import { GraphicCard } from "./GraphicCard";
import type { TutorialProps } from "./Root";
import { SectionLabel } from "./SectionLabel";
import { MIAMI } from "./theme";

export const Tutorial = ({ data }: TutorialProps) => {
  if (!data) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: MIAMI.shadow }}>
      {data.lines.map((timed) => {
        const { scene, section } = timed.line;
        return (
          <Sequence key={timed.line.id} from={timed.startFrame} durationInFrames={timed.frames}>
            <Footage segments={timed.segments} file={data.footageFile} />
            {scene.graphic ? <GraphicCard graphic={scene.graphic} /> : null}
            {scene.callout ? <Callout text={scene.callout} /> : null}
            <SectionLabel section={section} />
            <Captions words={timed.words} />
            {timed.audioFile ? <Audio src={staticFile(`audio/${timed.audioFile}`)} /> : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
