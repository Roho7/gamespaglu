import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import type { Word } from "../pipeline/schema";
import type { CaptionPlace } from "./data";
import { BODY } from "./fonts";
import { usePalette } from "./theme";

const MAX_CHARS = 26;
const MIN_WORDS = 2;
const BREAK = /[.,!?;:]["')\]]*$/;
const FADE_FRAMES = 3;

const width = (page: Word[]) => page.reduce((n, w) => n + w.text.length, 0) + page.length - 1;

/** Group a line's words into pages that each fit on one caption line, closing a page at punctuation where possible. */
export function pagesOf(words: Word[]): Word[][] {
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const word of words) {
    if (page.length > 0 && width([...page, word]) > MAX_CHARS) {
      pages.push(page);
      page = [];
    }
    page.push(word);
    if (page.length >= MIN_WORDS && BREAK.test(word.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length > 0) {
    const last = pages.at(-1);
    if (last && page.length < MIN_WORDS && width([...last, ...page]) <= MAX_CHARS) last.push(...page);
    else pages.push(page);
  }
  return pages;
}

export const Captions = ({ words, at }: { words: Word[]; at: CaptionPlace }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = usePalette();
  const t = frame / fps;
  const pages = pagesOf(words);
  if (pages.length === 0) return null;
  const pageIndex = Math.max(0, pages.findLastIndex((p) => p[0].startSec <= t));
  const page = pages[pageIndex];
  const currentIndex = page.findLastIndex((w) => w.startSec <= t);
  const since = frame - Math.round(page[0].startSec * fps);
  const enter = pageIndex === 0 ? 1 : interpolate(since, [0, FADE_FRAMES], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        ...(at === "top" ? { top: 92 } : { bottom: 400 }),
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: `${palette.shadow}A6`,
          borderRadius: 14,
          padding: "12px 26px 14px",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          display: "flex",
          columnGap: "0.3em",
          opacity: enter,
          transform: `translateY(${(1 - enter) * 8}px)`,
        }}
      >
        {page.map((word, i) => (
          <span
            key={`${word.startSec}-${i}`}
            style={{
              color: i === currentIndex ? palette.highlight : "#FFFFFF",
              opacity: i > currentIndex ? 0.45 : 1,
            }}
          >
            {word.text}
          </span>
        ))}
      </div>
    </div>
  );
};
