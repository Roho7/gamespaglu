import { Composition } from "remotion";

import { loadTutorial, type TutorialData } from "./data";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { Tutorial } from "./Tutorial";

export type TutorialProps = { data: TutorialData | null };

export const Root = () => (
  <Composition
    id="Tutorial"
    component={Tutorial}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={FPS}
    defaultProps={{ data: null } satisfies TutorialProps}
    calculateMetadata={async () => {
      const data = await loadTutorial();
      return { durationInFrames: data.totalFrames, props: { data } };
    }}
  />
);
