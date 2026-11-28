# How to play Wavelength

Written from the code, not the board game: `src/lib/wavelength/engine.ts`,
`src/components/wavelength/` and `WAVELENGTH_MODES` in `src/content/guides.ts`.
The spoken lines live in `dialogue.json`; this file is the readable version.

## Intro

Wavelength is a mind-reading game. Can your friends land the dial where you were thinking?

## Setting and requirements

You need two to sixteen players and one phone. No room to join, no accounts, no signal. Just pass the phone round.
Open Wavelength and pick a mode. There are three: One Psychic, One Guesser, and Teams.
Pick how many rounds, from one to six. Then add everyone's names and tap Start game.

## Gameplay

### One Psychic

Let's play One Psychic. Every card is a spectrum between two ends, and somewhere on it hides a target.
The Psychic presses and holds the dial to peek at the target. Nobody else looks.
Then they say a clue out loud, and can type it for the table. Stuck? Skip the card.
Now the phone goes round. Each guesser turns the dial in secret and locks it in.
Reveal! The bullseye scores four, right next to it two, and the edge one.
The Psychic scores the average of everyone's guesses, so a good clue pays.

### One Guesser

One Guesser, for two or more players, flips it around. One player looks away.
Everyone else holds the dial to see the target, and agrees on clues together.
Then hand over the phone. The guesser turns the dial alone, and keeps whatever it scores.

### Teams

Teams needs four or more players, split into two teams of at least two.
Teams take turns. Each team's Psychic gives a clue, then their own team talks it over and turns the dial.
Only the active team scores. Then the turn passes, with a new Psychic each time around.

## Rounds

A round is one turn for every player, or one card per team in Teams.
The counter up top shows the round, and the scoreboard keeps every point.

## Winning and losing

After the last card, tap Final score. The highest total wins.
Level at the top? It's a tie. And if nobody scores at all, it's static.
Play again, or change the settings. Now go find your wavelength.

## Where the code differs from the board game

- One phone, no board, no room code. Everyone shares one device.
- Three modes. The board game has teams only.
- Scoring bands are 4, 2 and 1 with no 3. Nobody steals points with left or right calls.
- No race to 10. You play a fixed number of rounds and the top score wins.
