import { spring, useCurrentFrame, useVideoConfig } from "remotion";

import type { Word } from "../pipeline/schema";
import { BODY } from "./fonts";
import { MIAMI, plate } from "./theme";

const MIN_WORDS = 3;
const MAX_WORDS = 6;
const BREAK = /[.,!?;:]["')\]]*$/;

/** Group a line's words into pages of 3 to 6, closing a page at punctuation where possible. */
export function pagesOf(words: Word[]): Word[][] {
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const word of words) {
    page.push(word);
    if (page.length >= MAX_WORDS || (page.length >= MIN_WORDS && BREAK.test(word.text))) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length > 0) {
    const last = pages.at(-1);
    if (last && page.length < MIN_WORDS && last.length + page.length <= MAX_WORDS + 1) last.push(...page);
    else pages.push(page);
  }
  return pages;
}

const CaptionWord = ({ word, state, since }: { word: Word; state: "spoken" | "current" | "upcoming"; since: number }) => {
  const { fps } = useVideoConfig();
  const pop = state === "current" ? spring({ frame: since, fps, config: { damping: 12, stiffness: 300 }, durationInFrames: 8 }) : 1;
  return (
    <span
      style={{
        display: "inline-block",
        color: state === "current" ? MIAMI.highlight : "#FFFFFF",
        opacity: state === "upcoming" ? 0.4 : 1,
        transform: state === "current" ? `scale(${1 + (1 - pop) * 0.1})` : undefined,
      }}
    >
      {word.text}
    </span>
  );
};

export const Captions = ({ words }: { words: Word[] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pages = pagesOf(words);
  const pageIndex = Math.max(0, pages.findLastIndex((p) => p[0].startSec <= t));
  const page = pages[pageIndex];
  const currentIndex = page.findLastIndex((w) => w.startSec <= t);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 48,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        key={pageIndex}
        style={{
          ...plate(MIAMI.shadow, 10),
          width: 1000,
          minHeight: 212,
          boxSizing: "border-box",
          alignContent: "center",
          padding: "22px 40px 26px",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 68,
          lineHeight: 1.2,
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "0.5em",
        }}
      >
        {page.map((word, i) => (
          <CaptionWord
            key={`${word.startSec}-${i}`}
            word={word}
            state={i === currentIndex ? "current" : i < currentIndex ? "spoken" : "upcoming"}
            since={frame - Math.round(word.startSec * fps)}
          />
        ))}
      </div>
    </div>
  );
};
