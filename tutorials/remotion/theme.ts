export const MIAMI = {
  base: "#5EC8FF",
  highlight: "#FFE066",
  secondary: "#1F7FC2",
  primary: "#102A4C",
  shadow: "#07142A",
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const GAP_SEC = 0.25;

export const XFADE_FRAMES = 4;

export const plate = (background: string, offset: number) =>
  ({
    background,
    boxShadow: `${offset}px ${offset}px 0 ${MIAMI.highlight}`,
    borderRadius: 0,
  }) as const;
