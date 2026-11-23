import { fill, whimsy } from "@/lib/whimsy";
import type { Policy, ShOutcome, ShPower, ShRole } from "@shared/protocol";

export type Beat = { title: string; line: string };

export const ROLE_LABEL: Record<ShRole, string> = {
  liberal: "Liberal",
  fascist: "Fascist",
  hitler: "Hitler",
};

export const POLICY_LABEL: Record<Policy, string> = { liberal: "Liberal", fascist: "Fascist" };

export const POWER_LABEL: Record<ShPower, string> = {
  investigate: "Investigate",
  "special-election": "Special election",
  peek: "Policy peek",
  execute: "Execution",
};

export const ROLE_BRIEF: Record<ShRole, string> = {
  liberal:
    "Pass five Liberal policies, or find Hitler and shoot. Trust nobody who smiles too much.",
  fascist:
    "Sneak six Fascist policies through, or get Hitler elected Chancellor once three are down. Lie beautifully.",
  hitler:
    "Act like the most reasonable Liberal at the table. Once three Fascist policies are down, get yourself elected Chancellor.",
};

export const ROLE_PAST: Record<ShRole, string> = {
  liberal: "You were a Liberal. Ghosts keep their mouths shut.",
  fascist: "You were a Fascist. Ghosts keep their mouths shut.",
  hitler: "You were Hitler.",
};

const DEALT: Beat[] = [
  { title: "Envelopes out", line: "Hold your card to see who you are. Poker faces on." },
  { title: "1932, again", line: "Hold your card to see who you are. Then act natural." },
  { title: "Secret identities", line: "Hold your card to see who you are. Tell nobody the truth." },
];

const PASSED = ["Ja!", "The people have spoken", "Government formed", "Motion carried"];
const FAILED = ["Nein!", "Rejected", "Back to the drawing board", "Not this lot"];
const LIBERAL_ENACTED = ["Liberal policy passed", "Democracy wins a round", "A win for the good guys"];
const FASCIST_ENACTED = ["Fascist policy passed", "Things are getting darker", "Uh oh"];
const CHAOS = ["Chaos!", "The mob takes over", "Three strikes"];

export function voteBeat(seed: string, passed: boolean, president: string, chancellor: string): Beat {
  return passed
    ? { title: whimsy(PASSED, seed), line: `${president} and ${chancellor} take office. Policies coming up.` }
    : { title: whimsy(FAILED, seed), line: "The election tracker ticks up. The presidency moves on." };
}

export function enactedBeat(seed: string, policy: Policy, chaos: boolean): Beat {
  if (chaos)
    return {
      title: whimsy(CHAOS, seed),
      line: `Three failed elections. The top card goes straight in: ${POLICY_LABEL[policy]}. Term limits are wiped.`,
    };
  return policy === "liberal"
    ? { title: whimsy(LIBERAL_ENACTED, seed), line: "One step closer to five." }
    : { title: whimsy(FASCIST_ENACTED, seed), line: "Ask the government what they were holding. They might even tell the truth." };
}

export function dealtBeat(seed: string): Beat {
  return whimsy(DEALT, seed);
}

const OUTCOME: Record<ShOutcome["reason"], Beat> = {
  "liberal-policies": { title: "Liberals win", line: "Five Liberal policies. Democracy survives the night." },
  "hitler-executed": { title: "Liberals win", line: "{name} was Hitler, and {name} is gone." },
  "fascist-policies": { title: "Fascists win", line: "Six Fascist policies. That's the whole board." },
  "hitler-elected": { title: "Fascists win", line: "{name} was Hitler, and you made them Chancellor." },
  aborted: { title: "Game called off", line: "Somebody left. Every card is face up now." },
};

export function outcomeBeat(outcome: ShOutcome, hitler: string): Beat {
  const beat = OUTCOME[outcome.reason];
  return { title: beat.title, line: fill(beat.line, { name: hitler }) };
}
