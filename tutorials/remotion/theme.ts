import { createContext, useContext } from "react";

import type { Palette } from "../pipeline/schema";

export const MIAMI: Palette = {
  base: "#5EC8FF",
  highlight: "#FFE066",
  secondary: "#1F7FC2",
  primary: "#102A4C",
  shadow: "#07142A",
};

export const PaletteContext = createContext<Palette>(MIAMI);

export const usePalette = () => useContext(PaletteContext);

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const XFADE_FRAMES = 4;

export const plate = (palette: Palette, background: string, offset: number) =>
  ({
    background,
    boxShadow: `${offset}px ${offset}px 0 ${palette.highlight}`,
    borderRadius: 0,
  }) as const;
