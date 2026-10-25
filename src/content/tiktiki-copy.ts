import type { Beat } from "@/content/mafia-copy";
import { fill, whimsy } from "@/lib/whimsy";
import type { TiktikiEnding } from "@shared/protocol";

type Pools = { titles: readonly string[]; lines: readonly string[] };

const DEAL: Pools = {
  titles: ["Where are we?", "Look around", "Somebody's listening", "Walls have ears", "Act like you belong"],
  lines: [
    "{name} asks first. Ask anyone about the place. No asking back.",
    "{name} kicks it off. One question to anyone, then they ask the next.",
    "{name}, you're up. Ask someone a question only a local could answer.",
    "{name} starts. Keep it vague enough to fool the Tiktiki, sharp enough to catch them.",
  ],
};

const TRIAL: Pools = {
  titles: ["{accuser} points at {accused}", "J'accuse!", "Order in the court", "Hands where we can see them"],
  lines: [
    "{accuser} thinks {accused} is the Tiktiki. Everyone else: guilty or not? It has to be unanimous.",
    "Guilty or not guilty. One no and {accused} walks.",
    "The clock's frozen. Look {accused} in the eye and vote.",
  ],
};

const ACQUITTED: Pools = {
  titles: ["Not guilty", "Case dismissed", "{accused} walks", "Hung jury"],
  lines: [
    "A no from {noes}. The clock's running again.",
    "Not convinced: {noes}. Back to the questions.",
    "Blocked by {noes}. Suspicious? Maybe. Keep asking.",
  ],
};

const UNMASKED: Record<TiktikiEnding, Pools> = {
  caught: {
    titles: ["Gotcha, {tiktiki}", "Caught on the wall", "Lizard spotted", "Busted"],
    lines: [
      "{tiktiki} was the Tiktiki. One guess at the place to wriggle free.",
      "Nailed it. But if {tiktiki} names the place, they still slip away.",
    ],
  },
  framed: {
    titles: ["Wrong lizard", "Oops", "Innocent!", "Framed"],
    lines: [
      "{accused} was innocent. {tiktiki} was the Tiktiki all along, and now they guess the place for a bonus.",
      "You convicted {accused}. {tiktiki} is laughing. Now they get a shot at the place too.",
    ],
  },
  clock: {
    titles: ["Time's up", "Out of time", "The clock wins"],
    lines: [
      "Nobody caught {tiktiki}. They were the Tiktiki, and now they guess the place.",
      "{tiktiki} survived the whole round. One guess for the bonus.",
    ],
  },
};

const OVER = {
  town: {
    titles: ["The table wins", "Squashed", "Off the wall", "Lizard down"],
    lines: ["{tiktiki} guessed {guess}. We were at {place}. Everyone else scores."],
  },
  escaped: {
    titles: ["The Tiktiki wins", "Slithered away", "Clean getaway", "Nobody's safe"],
    lines: [
      "We were at {place}. {tiktiki} guessed {guess}.",
      "{tiktiki} was the Tiktiki. We were at {place}, and they said {guess}.",
    ],
  },
  aborted: { titles: ["Round called off", "Everybody go home"], lines: ["Nobody scores. Nobody heard anything."] },
};

const beat = (pools: Pools, seed: string, slots: Record<string, string> = {}): Beat => ({
  title: fill(whimsy(pools.titles, `${seed}:title`), slots),
  line: fill(whimsy(pools.lines, `${seed}:line`), slots),
});

/** Every phone passes the same seed for the same moment, so the table reads the same line at once. */
export const tiktikiBeats = {
  deal: (seed: string, name: string) => beat(DEAL, seed, { name }),
  trial: (seed: string, accuser: string, accused: string) => beat(TRIAL, seed, { accuser, accused }),
  acquitted: (seed: string, accused: string, noes: string) => beat(ACQUITTED, seed, { accused, noes }),
  unmasked: (seed: string, ending: TiktikiEnding, tiktiki: string, accused: string) =>
    beat(UNMASKED[ending], seed, { tiktiki, accused }),
  over: (seed: string, result: keyof typeof OVER, slots: Record<string, string>) => beat(OVER[result], seed, slots),
};

/** The marquee during questioning. The same on every phone. */
export const ASK_RULE = "Ask anyone. No asking back.";

export const TIKTIKI_LABEL = "You're the Tiktiki";
