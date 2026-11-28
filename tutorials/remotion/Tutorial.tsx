import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";

import { Callout } from "./Callout";
import { Captions } from "./Captions";
import { Footage } from "./Footage";
import { GraphicCard } from "./GraphicCard";
import type { TutorialProps } from "./Root";
import { SectionLabel } from "./SectionLabel";
import { HEIGHT, PaletteContext, WIDTH } from "./theme";
import { framingAt, type ZoomWindow } from "./zoom";

const Zoomed = ({ zooms, children }: { zooms: ZoomWindow[]; children: React.ReactNode }) => {
  const { scale, x, y } = framingAt(zooms, useCurrentFrame());
  return (
    <AbsoluteFill
      style={{ transformOrigin: "0 0", transform: `translate(${x * WIDTH}px, ${y * HEIGHT}px) scale(${scale})` }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Tutorial = ({ data }: TutorialProps) => {
  if (!data) return null;
  return (
    <PaletteContext.Provider value={data.palette}>
      <AbsoluteFill style={{ backgroundColor: data.palette.shadow }}>
        {data.lines.map((timed) => {
          const { scene, section } = timed.line;
          return (
            <Sequence key={timed.line.id} from={timed.startFrame} durationInFrames={timed.frames}>
              <Zoomed zooms={timed.zooms}>
                <Footage segments={timed.segments} file={data.footageFile} />
              </Zoomed>
              {scene.graphic ? <GraphicCard graphic={scene.graphic} /> : null}
              {scene.callout ? <Callout text={scene.callout} /> : null}
              <SectionLabel label={data.dialogue.sectionLabels?.[section] ?? section} />
              <Captions words={timed.words} at={timed.captionAt} />
              {timed.audioFile ? <Audio src={staticFile(`audio/${timed.audioFile}`)} /> : null}
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </PaletteContext.Provider>
  );
};
