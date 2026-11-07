import type { Beat } from "@/content/mafia-copy";
import { fill, whimsy } from "@/lib/whimsy";
import type { TiktikiEnding } from "@shared/protocol";

type Pools = { titles: readonly string[]; lines: readonly string[] };

const DEAL: Pools = {
  titles: ["Where are we?", "Look around", "Somebody's listening", "Walls have ears", "Act like you belong"],
  lines: [
    "Starting from {name}, ask someone about the place.",
    "{name} is the first to ask. Ask someone about the place.",
  ],
};

const TRIAL: Pools = {
  titles: ["Accused!", "J'accuse!", "Somebody is sus!", "Hmm...."],
  lines: [
    "{accuser} thinks {accused} is the Tiktiki.",
    "{accuser} has put {accused} on trial.",
    "{accused} has been accused by {accuser}.",
  ],
};

const ACQUITTED: Pools = {
  titles: ["Not guilty", "Case dismissed", "{accused} walks", "Not today"],
  lines: [
    "Inconclusive. {noes} voted NO.",
    "Not convinced. Back to the questions.",
    "Keep asking questions.",
  ],
};

const UNMASKED: Record<TiktikiEnding, Pools> = {
  caught: {
    titles: ["Gotcha, {tiktiki}", "Caught on the wall", "Lizard spotted", "Busted"],
    lines: [
      "{tiktiki} was the Tiktiki. If they guess the place, they still win.",
      "{tiktiki} got caught. But if they guess correctly, they win.",
    ],
  },
  framed: {
    titles: ["Wrong lizard", "Oops", "Innocent!", "Framed"],
    lines: [
      "{accused} was innocent. {tiktiki} was the Tiktiki all along.",
      "You convicted {accused}. {tiktiki} is laughing.",
    ],
  },
  clock: {
    titles: ["Time's up", "Out of time", "The clock wins"],
    lines: [
      "Nobody caught {tiktiki}. They escaped like a spy.",
      "{tiktiki} survived the whole round.",
    ],
  },
};

const OVER = {
  town: {
    titles: ["The table wins", "Squashed", "Off the wall", "Lizard down"],
    lines: ["{tiktiki} guessed {guess}. We were at {place}."],
  },
  escaped: {
    titles: ["The Tiktiki wins", "Clean getaway", "Smooth criminal"],
    lines: [
      "{tiktiki} guessed {guess}. They're smart!",
    ],
  },
  aborted: { titles: ["Round called off", "Everybody go home"], lines: ["Nobody scores."] },
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
export const ASK_RULE = "No asking back.";

export const TIKTIKI_LABEL = "You're the Tiktiki";
