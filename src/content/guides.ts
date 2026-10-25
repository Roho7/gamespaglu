import type { PaletteId } from "@/lib/palettes";
import type { CategoryId } from "@/lib/deck/types";
import type { Mode } from "@/lib/wavelength/engine";

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
  palette: PaletteId;
  players: string;
  time: string;
  needs: string;
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
    slug: "wavelength",
    title: "How to play Wavelength",
    summary:
      "One clue, one hidden target, one dial. Read your friends' minds on a spectrum between two ends. One Psychic, One Guesser or two teams, on one phone.",
    palette: "miami",
    players: "2 to 12",
    time: "About two minutes a card",
    needs: "One phone for the whole table",
    playRoute: "/wavelength",
    alsoCalled: [
      "Dial guessing game",
      "Spectrum game",
      "Mind reading party game",
    ],
    intro: [
      "Wavelength is a guessing game about how alike your heads are. Every card names a spectrum between two ends, like Cold and Hot or Overrated and Underrated. Somewhere on that spectrum is a hidden target only one player, the Psychic, gets to see.",
      "The Psychic says one clue out loud that they think sits exactly there. Their team argues about it and turns the dial. Then the target is revealed, and the closer the dial, the more points.",
      "It needs one phone for the whole table and no signal at all. The phone is the dial, the shutter and the scorekeeper. The arguing is yours.",
    ],
    steps: [
      {
        title: "Pick a Psychic",
        body: "One player takes the phone. Everyone else looks away. The Psychic presses and holds the dial to see where the target sits; letting go hides it again. If the card is hopeless, they can skip it before saying anything.",
      },
      {
        title: "Say one clue",
        body: "Out loud, the Psychic names one thing that sits where the target is, and can type it into the box so it stays on screen while the guessing happens. On Cold to Hot with the target just right of centre, \u201cchai\u201d works. No numbers, no pointing, no explaining the clue after it is out.",
      },
      {
        title: "Turn the dial",
        body: "The Psychic's team talks it over and drags the dial to where they think the clue lives. The Psychic keeps a straight face. When the team agrees, lock it in.",
      },
      {
        title: "The other team calls left or right",
        body: "With two teams, the other side now guesses whether the target is left or right of the dial. They get a point if they are right, unless the dial landed dead centre.",
      },
      {
        title: "Reveal and score",
        body: "The target appears. Dead centre scores 4, the bands either side 2, the next ones out 1, anything else nothing. The points go straight onto the scoreboard, and the banner over the dial says who takes the phone next.",
      },
    ],
    variations: [
      {
        title: "One Psychic",
        body: "Everyone for themselves. One Psychic gives the clue and every other player guesses in secret, passing the phone round so nobody sees the others' dials. Each guesser scores their own band, and the Psychic scores the average of the table. The Psychic moves one seat on every card.",
      },
      {
        title: "One Guesser",
        body: "The mirror image. One player looks away while everyone else sees the target and agrees on clues together. The guesser turns the dial and keeps whatever it scores. A different player guesses every card.",
      },
      {
        title: "Teams",
        body: "Two teams take turns, each with its own Psychic. After the dial is locked the other team calls left or right for a bonus point, unless the dial landed dead centre. The highest score after the last round wins.",
      },
      {
        title: "Rounds",
        body: "A round is one turn for every seat: every player takes the rotating role once, or each team plays once. Pick between one and six rounds before you start; the scoreboard keeps the running total.",
      },
    ],
    faq: [
      {
        q: "Does everyone need a phone?",
        a: "No. One phone does the whole game. Only the Psychic needs to see the target, and only while holding the button, so the phone just goes around the table.",
      },
      {
        q: "Does it work offline?",
        a: "Yes. Once the page has loaded it works with no signal at all, and the game survives a refresh or a locked screen.",
      },
      {
        q: "What makes a good clue?",
        a: "Something everyone at the table knows. A clue only works if your team pictures the same thing you do, so the most famous example usually beats the cleverest one.",
      },
    ],
  },
  {
    slug: "who-am-i",
    title: "How to play Who Am I?",
    summary:
      "The phone-on-forehead guessing game. Everyone can see your name except you. Rules, question tactics and six ways to play it.",
    palette: "tangerine",
    players: "3 or more",
    time: "As long as the room lasts",
    needs: "One phone per player",
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
    slug: "girgit",
    title: "How to play Girgit",
    summary:
      "Sixteen words, one secret, and one player who has no idea which. Everyone writes one clue, then the table works out who was bluffing.",
    palette: "jungle",
    players: "4 to 10",
    time: "About four minutes a round",
    needs: "A phone each, everyone in the same room",
    playRoute: "/girgit/new",
    alsoCalled: [
      "The Chameleon",
      "Word imposter",
      "Undercover word game",
      "Spy word game",
    ],
    intro: [
      "Girgit is a social deduction game for a table of four to ten. Everyone sees the same grid of sixteen words and the same theme. Everyone can also see which one of those words is the secret \u2014 except one player, the Girgit, who knows only that they are the Girgit.",
      "Then everyone types a single clue about the secret word. All the clues appear at once. The innocent players are trying to prove they know the word without spelling it out; the Girgit is trying to sound like they know it. Then you argue, and you vote.",
      "If you have played The Chameleon, you already know this game. Girgit (\u0917\u093f\u0930\u0917\u093f\u091f) is Hindi for chameleon \u2014 and it carries the idiom too: girgit ki tarah rang badalna, to change colours, to be two-faced.",
    ],
    steps: [
      {
        title: "Everyone joins one room",
        body: "One person taps Start a room and reads out the four-letter code. Everyone else types it in on their own phone. Nothing is installed and nobody makes an account \u2014 your phone is your seat, and if you close the app and come back, you are still in it.",
      },
      {
        title: "Look at your word, carefully",
        body: "Hold the button to see the secret word. It shows only while your finger is down, and it never lights up a square on the grid \u2014 a glowing square is readable from across a table by its position alone, without anybody reading a thing. If you are the Girgit, holding the button tells you so, in exactly the same place on screen, so nobody learns anything by watching you.",
      },
      {
        title: "One clue each, revealed together",
        body: "Type one or two words. Nobody sees anything until the last clue is in, and then they all appear at once with names attached. That simultaneous reveal is the one place this beats the cardboard version: around a table the last person to speak has everybody else's clues for cover, and the Chameleon desperately wants to go last. Here there is no last.",
      },
      {
        title: "Argue. Out loud",
        body: "This is the game, and the app deliberately does nothing during it. No timer, no chat, no prompts \u2014 just the grid and the clues sitting there while you accuse each other. A clue that is too vague is suspicious. A clue that is too precise is suspicious. So is agreeing with everyone too quickly.",
      },
      {
        title: "Call the vote",
        body: "Anybody can call it \u2014 you do not need to be the host. Everyone taps a name, nobody sees the votes until they are all in, and then every vote is shown with who cast it. A tie sends you back to arguing, which is exactly what would happen at a table anyway.",
      },
      {
        title: "The escape",
        body: "If the table picks the Girgit, it is not over. They get one guess at the secret word. Guess right and they walk away with a point anyway. This is what stops an accused player going quiet \u2014 there is always something left to play for.",
      },
    ],
    variations: [
      {
        title: "Scoring",
        body: "Girgit not caught: two points to them. Caught but guesses the word: one point. Caught and guesses wrong: a point to everyone else. There is no target score and no winner \u2014 the session runs until people stop, which is how party games actually end.",
      },
      {
        title: "Someone has to leave",
        body: "Locking your phone does not lose your seat: you show as away and the round waits. Leaving properly takes effect at the end of the round rather than mid-hand. And if somebody genuinely walks off while holding the secret, the host can abort the round from the room menu \u2014 nobody scores and you deal again.",
      },
      {
        title: "Four players or ten",
        body: "Four works and is sharp \u2014 with fewer clues each one carries more weight. Around seven or eight is the sweet spot. Ten is the ceiling, because sixteen words and ten clues is about as much as anyone can hold in their head.",
      },
    ],
    faq: [
      {
        q: "Does everyone need their own phone?",
        a: "Yes. Each player has to see their own secret without anyone else seeing it, so passing one phone around does not work here.",
      },
      {
        q: "Can we play it over a video call?",
        a: "It works, but it is not what it is for. The game is built for people in the same room \u2014 the hesitation and the eye contact are most of it, and there is no voice chat here because we assume you can already hear each other.",
      },
      {
        q: "What if my phone dies or I lose signal?",
        a: "Your seat, your role and your word are held on the server, not on your phone. Come back and you drop straight into whatever the room is doing. Girgit and Mafia are the parts of this site that genuinely need a connection \u2014 everything else works with no signal at all.",
      },
      {
        q: "Does the Girgit know they are the Girgit?",
        a: "Yes. They see the grid and the theme but not the secret word, so they know they are bluffing from the first second. That is what makes it different from games where the odd one out has no idea.",
      },
      {
        q: "Is this The Chameleon?",
        a: "It is the same mechanic. The Chameleon is a Big Potato Games title and the name is theirs; Girgit is ours, and if you like one you will like the other. Go buy the box too \u2014 it is a good box.",
      },
    ],
  },

  {
    slug: "mafia",
    title: "How to play Mafia",
    summary:
      "Secret roles, silent nights, loud days. The classic party game for five to twelve, where every phone is the narrator so nobody has to sit out.",
    palette: "cherry",
    players: "5 to 12",
    time: "About twenty minutes a game",
    needs: "A phone each, everyone in the same room",
    playRoute: "/mafia/new",
    alsoCalled: ["Werewolf", "Mafia party game", "Mafia card game"],
    intro: [
      "Mafia is the social deduction game every college trip and office offsite has played at least once. A few players are secretly the Mafia. Everyone else is the town. At night the Mafia kill someone; by day the town argues about who did it and votes somebody out.",
      "Around a table it needs a narrator: one person who sits out, deals the roles on scraps of paper and walks everyone through the night with their eyes shut. Here every phone does that job. Roles are dealt to each phone, the night happens on the screens, and the narrator gets to play.",
      "Nobody closes their eyes. Every living player taps their phone every night, whatever their role, and every screen says the same thing \u2014 so the person tapping next to you could be anyone.",
    ],
    steps: [
      {
        title: "Everyone joins one room",
        body: "One person taps Host and reads out the four-letter code. Everyone else types it in on their own phone. The lobby shows the roles your headcount will deal: one Mafia for five or six players, two for seven to nine, three for ten to twelve, plus a Doctor and a Detective. Everyone else is a Villager.",
      },
      {
        title: "Check your card",
        body: "Press and hold the card button to see your role, and let go to hide it. The card opens in the same frame for every role, so nobody learns anything from watching you. Mafia also see who the rest of their team is.",
      },
      {
        title: "Night: everyone chooses a player",
        body: "Every living phone says the same thing: choose a player. The Mafia choose who to kill, and all of them have to agree. The Doctor chooses someone to save, themselves included, but never the same player two nights running. The Detective chooses someone to check. Villagers choose whoever they suspect. You can change your pick until the night ends, which happens the moment everyone has locked in and the Mafia agree.",
      },
      {
        title: "Morning: the news",
        body: "Every phone shows who died in the night, and what they were. If the Doctor saved the right person, nobody died. The Detective's answer arrives on their card: Mafia, or not Mafia.",
      },
      {
        title: "Day: argue, then vote",
        body: "Talk. Accuse. Defend. When the table is ready, anyone still in taps Call the vote. Everyone votes in secret for a living player or for No one, and every ballot is shown with who cast it once they are all in. The single most-voted player goes out and their role is revealed. A tie, or No one winning, sends nobody out.",
      },
      {
        title: "Until one side wins",
        body: "Anyone still in taps Night falls and it starts again. The town wins when every Mafia is out. The Mafia win the moment they equal or outnumber everyone else. Then every role is revealed, with a replay of who went for whom every night.",
      },
    ],
    variations: [
      {
        title: "Scoring",
        body: "Everyone on the winning side scores a point, including the players who died along the way: dying for the town is still winning. The end of every game shows the running tally, so a night of five games has a real leader.",
      },
      {
        title: "A phone goes quiet",
        body: "Locking your phone does not lose your seat; you show as away. If the night is stuck on somebody who has wandered off, the host can end it from the room menu: any pick not made counts as nothing. The host can close a stalled vote the same way.",
      },
      {
        title: "Someone goes home",
        body: "Leaving mid-game, or being removed by the host, counts as going out: the role is revealed and the game checks whether either side has just won. People who join mid-game watch until the next deal.",
      },
      {
        title: "When you are out",
        body: "Dead players keep watching the board and the votes but see nothing secret, so there is nothing to give away. The polite thing is to stay quiet.",
      },
    ],
    faq: [
      {
        q: "Does everyone need their own phone?",
        a: "Yes. Every player's role and every night pick is private, so one phone passed around would give the game away.",
      },
      {
        q: "Do we need a narrator?",
        a: "No. The phones deal the roles, run the night and announce the morning, so everybody plays, including the person who would usually sit out.",
      },
      {
        q: "Why does everyone tap at night, even Villagers?",
        a: "Cover. If only the Mafia, the Doctor and the Detective touched their phones at night, you could find them by watching hands. Villagers pick a suspect instead, and those hunches show up in the replay at the end.",
      },
      {
        q: "Is this the same as Werewolf?",
        a: "Werewolf is Mafia with wolves. Same game, same roles under different names, and if you know one you know the other.",
      },
      {
        q: "How many players do we need?",
        a: "Five at least and twelve at most. Seven to nine is the sweet spot: two Mafia, a Doctor, a Detective and enough Villagers to argue.",
      },
    ],
  },
  {
    slug: "scoreboard",
    title: "How to use the Scoreboard",
    summary:
      "A score tracker for any game played in person — cards, carrom, board games, antakshari. Players or teams, tap to score, undo mistakes.",
    palette: "flamingo",
    players: "2 or more",
    time: "One session",
    needs: "One phone, passed around or left on the table",
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
];
export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}

/** The three Wavelength modes as the briefing's tabs show them. */
export const WAVELENGTH_MODES: Record<
  Mode,
  { name: string; players: string; minPlayers: number; steps: string[] }
> = {
  psychic: {
    name: "One Psychic",
    players: "2+ players",
    minPlayers: 2,
    steps: [
      "The Psychic holds the dial to see the target. Nobody else looks.",
      "They say a clue out loud, and can type it for the table.",
      "The phone goes round. Everyone else turns the dial in secret and locks it in.",
      "Reveal. Each guesser scores 4, 2 or 1; the Psychic scores the average.",
    ],
  },
  guesser: {
    name: "One Guesser",
    players: "2+ players",
    minPlayers: 2,
    steps: [
      "One player looks away. They are the guesser this card.",
      "Everyone else holds the dial to see the target and agrees on clues.",
      "Say the clues out loud, or type them, then hand the phone over.",
      "The guesser turns the dial and keeps the 4, 2 or 1 it scores.",
    ],
  },
  teams: {
    name: "Teams",
    players: "4+ players",
    minPlayers: 4,
    steps: [
      "The active team's Psychic holds the dial to see the target.",
      "They give one clue out loud, and can type it for the table.",
      "Their team talks it over, turns the dial and locks it in.",
      "The other team calls left or right of the dial for a bonus point.",
      "Reveal. The active team scores 4, 2 or 1, then the turn passes.",
    ],
  },
};
