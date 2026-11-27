# How to play Wavelength

Written from the code, not the board game: `src/lib/wavelength/engine.ts`,
`src/components/wavelength/` and `WAVELENGTH_MODES` in `src/content/guides.ts`.
The spoken lines live in `dialogue.json`; this file is the readable version.

## Intro

Welcome to Wavelength on Games Paglu. One clue, one hidden target, and a dial to find it.
It's a mind-reading game. Can your friends land the dial where you were thinking?

## Setting and requirements

You need two to sixteen players and one phone. There's no room to create or join. You pass the phone round the table.
No accounts, and no signal needed.
Open Wavelength and pick a mode. One Psychic and One Guesser need two or more players. Teams needs four, split into two teams.
Pick how many rounds, from one to six. Then add everyone's names and tap Start game.

## Gameplay

Every card is a spectrum between two ends. Somewhere on it hides a target.
The Psychic presses and holds the dial to peek at the target. Nobody else looks.
Then they say a clue out loud, and can type it for the table. Stuck? Skip the card.
Now the phone goes round. Each guesser turns the dial in secret and locks it in.
Reveal! The bullseye scores four, right next to it two, and the edge one.
The Psychic scores the average of everyone's guesses, so a good clue pays.
In One Guesser, everyone else agrees the clues and one player guesses. In Teams, each team's Psychic clues for their own team.

## Rounds

A round is one turn for every player. Three rounds means everyone is the Psychic three times.
The counter up top shows the round, and the scoreboard keeps every point.

## Winning and losing

After the last card, tap Final score. The highest total wins.
Level at the top? It's a tie. And if nobody scores at all, it's static.
Play again with the same players, or change the settings. Now go find your wavelength.

## Where the code differs from the board game

- One phone, no board, no room code. Everyone shares one device.
- Three modes. The board game has teams only.
- Scoring bands are 4, 2 and 1 with no 3. Nobody steals points with left or right calls.
- No race to 10. You play a fixed number of rounds and the top score wins.
