import { fill, whimsy } from "@/lib/whimsy";
import type { MafiaOutcome, MafiaRole } from "@shared/protocol";

/** One beat of the game, as the curtain and the headline print it. */
export type Beat = { title: string; line: string };

type Pools = { titles: readonly string[]; lines: readonly string[] };

const AS_A: Record<MafiaRole, string> = {
  mafia: "Mafia",
  doctor: "the Doctor",
  detective: "the Detective",
  villager: "a humble Villager",
};

const NIGHT: Pools = {
  titles: ["Night falls", "Lights out", "The town sleeps", "Something stirs", "Shhh", "After hours"],
  lines: [
    "Everyone picks someone. Act natural.",
    "Phones out, poker faces on.",
    "The streets are quiet. Too quiet. Tap a name.",
    "Somebody at this table is up to no good tonight.",
    "Don't look at your neighbour's screen. Don't look guilty either.",
    "Choose wisely. Or at least choose quickly.",
  ],
};

const DEATH: Pools = {
  titles: [
    "{name} sleeps with the fishes",
    "{name} got whacked",
    "RIP {name}",
    "{name} didn't make it",
    "{name} has been taken out",
    "Goodnight, {name}",
  ],
  lines: [
    "They were {role}. Somebody here knows exactly why.",
    "Turns out they were {role}. Pour one out.",
    "They were {role}. Look around. Who's sweating?",
    "They were {role}. The Mafia send their regards.",
  ],
};

const QUIET: Pools = {
  titles: ["Everyone woke up", "Not today, Mafia", "A quiet night", "All alive, somehow"],
  lines: [
    "Either the Doctor is a genius or the Mafia couldn't agree on dinner.",
    "Nobody died. Suspicious, honestly.",
    "The Doctor earned their fees tonight. Or did they?",
    "Not a scratch on anyone. Someone's luck is running out.",
  ],
};

const VOTE: Pools = {
  titles: ["Time to vote", "Point fingers", "Court is in session", "Judgement day", "Who's it gonna be?"],
  lines: [
    "Pick who goes. Or bottle it and pick No one.",
    "Votes are secret until they very much aren't.",
    "One name. No take-backs.",
    "Choose the face that looks most guilty.",
  ],
};

const EXILED = [
  "{name} was exiled",
  "{name} got thrown out",
  "{name} is barred",
  "{name} has been cancelled",
  "Bye bye, {name}",
  "{name} is outta here",
];

const CAUGHT = [
  "And they were Mafia. Nailed it.",
  "Mafia, confirmed. The town does a little dance.",
  "Caught red-handed. One less crook on the streets.",
];

const WRONGED = [
  "They were {role}. Oops.",
  "They were {role}. The Mafia are loving this.",
  "They were {role}. Someone owes them an apology.",
];

const SPARED: Pools = {
  titles: ["Nobody goes", "Hung jury", "The town bottled it", "Stalemate"],
  lines: [
    "Everyone lives to lie another day.",
    "No consensus. Night is coming anyway.",
    "Democracy, everybody.",
  ],
};

const ENDINGS: Record<MafiaOutcome, Pools> = {
  town: {
    titles: ["The town wins", "Justice, baby", "Mafia busted", "The streets are safe"],
    lines: ["Every last crook, caught. Take a bow.", "The good guys won. Try not to gloat. Gloat a little."],
  },
  mafia: {
    titles: ["The Mafia win", "The family runs this town", "Bada bing, bada boom", "It's their town now"],
    lines: [
      "The Mafia outnumber you. Kiss the ring.",
      "They lied to your face and you thanked them for it.",
    ],
  },
  aborted: {
    titles: ["Game called off", "Everybody go home"],
    lines: ["Nobody saw anything. Nobody scores."],
  },
};

const beat = (pools: Pools, seed: string, slots: Record<string, string> = {}): Beat => ({
  title: fill(whimsy(pools.titles, `${seed}:title`), slots),
  line: fill(whimsy(pools.lines, `${seed}:line`), slots),
});

/** Every phone passes the same seed for the same moment, so the table reads the same joke at once. */
export const mafiaBeats = {
  night: (seed: string) => beat(NIGHT, seed),
  morning: (seed: string, died: { name: string; role: MafiaRole } | null) =>
    died ? beat(DEATH, seed, { name: died.name, role: AS_A[died.role] }) : beat(QUIET, seed),
  vote: (seed: string) => beat(VOTE, seed),
  verdict: (seed: string, out: { name: string; role: MafiaRole } | null) =>
    out
      ? beat({ titles: EXILED, lines: out.role === "mafia" ? CAUGHT : WRONGED }, seed, {
        name: out.name,
        role: AS_A[out.role],
      })
      : beat(SPARED, seed),
  over: (seed: string, outcome: MafiaOutcome) => beat(ENDINGS[outcome], seed),
};

/** The one mechanical instruction on the card at night, the same for every role. */
export const HOW_TO_PICK = "Tap a name on the board, then lock it in";

/** What your card says about who you are and what to do tonight. */
export const ROLE_BRIEF: Record<MafiaRole, string> = {
  mafia: "You are Mafia. Pick someone to whack tonight. Your crew has to agree, or nobody gets got.",
  doctor: "You are the Doctor. Pick someone to save tonight. Yourself counts. The same face two nights running doesn't.",
  detective: "You are the Detective. Pick someone to snoop on. The truth lands on this card by morning.",
  villager: "You are a Villager. Pick who you think is a member of the Mafia.",
};
