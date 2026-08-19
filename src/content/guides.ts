import type { CategoryId } from "@/lib/types";

/**
 * The How to play section. This is where the words live now — the play screens
 * are a colour and a button, and every explanation moved here.
 *
 * It is also the SEO plan: these articles chase rules-and-intent queries
 * ("how to play who am i", "celebrity head game rules") which are far less
 * contested than the tool queries the /random-*-generator routes chase, and a
 * reader who arrives here is one tap from playing.
 */
export type Guide = {
  slug: string;
  title: string;
  /** Card + meta description. */
  summary: string;
  emoji: string;
  colourway: string;
  players: string;
  time: string;
  needs: string;
  status: "live" | "planned";
  /** Route to actually play it, if it exists. */
  playRoute?: string;
  alsoCalled?: string[];
  intro: string[];
  steps: { title: string; body: string }[];
  variations?: { title: string; body: string }[];
  categories?: CategoryId[];
  faq?: { q: string; a: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "who-am-i",
    title: "How to play Who Am I?",
    summary:
      "The phone-on-forehead guessing game. Everyone can see your name except you. Rules, question tactics and six ways to play it.",
    emoji: "🙈",
    colourway: "pillar",
    players: "3 or more",
    time: "As long as the room lasts",
    needs: "One phone per player",
    status: "live",
    playRoute: "/who-am-i/celebrity",
    alsoCalled: [
      "Heads Up",
      "Celebrity Head",
      "Hedbanz",
      "Name on forehead game",
      "Indian Poker (numbers version)",
    ],
    intro: [
      "Who Am I? is the game where you become someone — or something — and everyone in the room knows who except you. Your job is to work it out by asking questions. Their job is to answer honestly and enjoy watching you struggle.",
      "It traditionally needs paper slips and sticky tape. It doesn't. Every player opens this on their own phone, generates a name, and holds the screen against their forehead facing outward. No writing, no tape, no arguments about handwriting.",
    ],
    steps: [
      {
        title: "Everyone opens the same category",
        body: "Agree on one category out loud — celebrity, movie, place, animal, object or number — and everyone opens it on their own phone. Nothing syncs between phones, and nothing needs to: each player draws independently.",
      },
      {
        title: "Generate, then get it up fast",
        body: "Tap Generate and you get a three-second countdown. That is your window to raise the phone to your forehead, screen facing out, before the word appears. No peeking is on the honour system — this is a party, not an exam.",
      },
      {
        title: "Go around the circle asking questions",
        body: "Take turns asking questions the room can answer with yes or no. Am I alive? Am I Indian? Would my mother know me? A common house rule: keep asking as long as you get a yes, and pass on a no.",
      },
      {
        title: "Guess, then go again",
        body: "When you have it, say it out loud. The word stays on screen until somebody taps Generate, so there is no timer breathing down your neck and no round to reset. Tap Generate for the next one.",
      },
    ],
    variations: [
      {
        title: "Numbers — the Indian Poker version",
        body: "Everyone draws a number from 1 to 100 instead of a name. Now the questions are mathematical: am I even? Am I bigger than yours? It plays completely differently and it's the fastest version to teach.",
      },
      {
        title: "Mixed-nationality rooms",
        body: "Turn on more than one country in the settings drawer. A room of Indian and American friends should have both India and USA lit up, or half the room will be guessing names they've never heard.",
      },
      {
        title: "One-industry rounds",
        body: "In the settings drawer, switch on only Tamil, or only Malayalam. A Bollywood-only round and a Kollywood-only round are genuinely different games with different experts in the room.",
      },
      {
        title: "Kids mode — cartoons only",
        body: "In the settings drawer, tap Cartoon on its own. You get Doraemon, Shinchan, Chhota Bheem, Tom and Jerry, Mickey Mouse and the rest — nothing a seven-year-old won't know. Anime and Superhero are separate chips, so you can build a round for teenagers instead.",
      },
      {
        title: "Internet round",
        body: "Tap Internet for a deck of YouTubers and influencers — MrBeast, CarryMinati, Bhuvan Bam, PewDiePie. Ruthless on anyone over thirty, which is the point.",
      },
      {
        title: "Classic vs modern",
        body: "The era toggle is separate from who-counts, so Music + Classic gives you Kishore Kumar and Elvis, while Music + Modern gives you Arijit Singh and Drake. Names that never went away — Batman, Sachin, Mickey Mouse — answer to both.",
      },
      {
        title: "Team play",
        body: "Split into pairs. One partner holds the phone, the other may only answer yes or no. Fastest pair to five correct wins — track it on the Scoreboard.",
      },
    ],
    categories: ["celebrity", "movie", "place", "animal", "object", "number"],
    faq: [
      {
        q: "How many people do you need?",
        a: "Three is the practical minimum — you need at least two people who can see your screen and argue about the answer. It gets better at five or six.",
      },
      {
        q: "What if nobody in the room knows the name?",
        a: "It shouldn't happen: every name is hand-checked to be someone widely recognised, and nothing repeats until the deck runs out. If it does, tap Generate and move on. A dead name is worse than a repeat.",
      },
      {
        q: "Does it work without internet?",
        a: "Yes. Add the site to your home screen once and every word list is stored on the device. It plays in a basement, on a train, or on aeroplane mode.",
      },
      {
        q: "Is this the same as Heads Up?",
        a: "It's the same family. Heads Up is an app where you hold the phone up and race a timer; Who Am I? and Celebrity Head are the older, slower, question-based version. This is the question-based one, with no timer.",
      },
    ],
  },
  {
    slug: "scoreboard",
    title: "How to use the Scoreboard",
    summary:
      "A score tracker for any game played in person — cards, carrom, board games, antakshari. Players or teams, tap to score, undo mistakes.",
    emoji: "🏆",
    colourway: "mustard",
    players: "2 or more",
    time: "One session",
    needs: "One phone, passed around or left on the table",
    status: "live",
    playRoute: "/scoreboard",
    intro: [
      "Every in-person game eventually needs somebody to keep score, and that somebody always ends up using the back of an envelope. This replaces the envelope.",
      "It is deliberately not tied to any game. Rummy, carrom, badminton, antakshari, a quiz you invented ten minutes ago — the Scoreboard doesn't care what the points mean.",
    ],
    steps: [
      {
        title: "Add players or teams",
        body: "Type a name and hit Add. The same field takes team names, so 'Boys vs Girls' or 'Table 2' works exactly like a person's name.",
      },
      {
        title: "Score with the big buttons",
        body: "Each row has a minus on the left and a plus on the right, sized for a thumb from across the table. Set the step to 1, 5 or 10 for games that score in chunks.",
      },
      {
        title: "Type an exact score when it's odd",
        body: "Tap the number itself and type over it. Useful for a round that scored 37, and for correcting whoever was in charge before you.",
      },
      {
        title: "Undo, reset or start fresh",
        body: "Undo walks back the last twenty changes. Reset scores keeps the names for a rematch; New game clears everything. Both ask first, because a mis-tap would lose the whole night.",
      },
    ],
    faq: [
      {
        q: "Does it remember the scores if I close the tab?",
        a: "Yes. The board is stored on the device, so it survives a refresh, a locked phone and a closed browser. It stays until you clear it.",
      },
      {
        q: "Can two phones share one scoreboard?",
        a: "Not yet. One phone holds the board today. Shared, live scoreboards arrive with rooms.",
      },
    ],
  },
  {
    slug: "secret-hitler",
    title: "Secret Hitler and other imposter games",
    summary:
      "What's coming next: rooms you join with a code, for hidden-role games like Secret Hitler, Spyfall and Werewolf.",
    emoji: "🕵️",
    colourway: "indigo",
    players: "5 or more",
    time: "30–60 minutes",
    needs: "A phone each",
    status: "planned",
    intro: [
      "Hidden-role games are the obvious next step for a site like this: the phone is genuinely better than paper because it can deal secret information to each player without anyone glimpsing anyone else's card.",
      "That needs something today's Games Paglu deliberately doesn't have — a room that all the phones join, and a server that knows who is who and never tells the wrong person. It's being built next, not now.",
    ],
    steps: [
      {
        title: "How it will work",
        body: "One person creates a room and reads out a four-letter code. Everyone joins on their own phone. The server deals each player their secret role privately, and the host runs the round from their screen.",
      },
      {
        title: "What's on the list",
        body: "Secret Hitler first, then Spyfall-style imposter rounds using an everyday-locations word list, then Werewolf and Connections-style word games.",
      },
    ],
    faq: [
      {
        q: "When?",
        a: "No date. Who Am I? and the Scoreboard needed to be genuinely good first, and rooms are a much bigger build than either.",
      },
    ],
  },
];

export const LIVE_GUIDES = GUIDES.filter((g) => g.status === "live");

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
