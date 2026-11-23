# Secret Hitler: rules spec

This is the spec that `engine.ts` implements and `engine.test.ts` checks. Each rule cites its source.

**Sources.** The authority is the official rulebook, [Secret_Hitler_Rules.pdf](https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf), cited as *Rules p.N*. The power layout of each fascist board appears only on the boards themselves, so it comes from the official [Print and Play PDF](https://www.secrethitler.com/assets/Secret_Hitler_Print_and_Play.pdf), boards B, C and D, cited as *PnP*. No community source was needed. Where the rulebook is silent, the [Ambiguities](#ambiguities-resolved) section gives the choice the engine makes and the reason.

Secret Hitler is by Mike Boxleiter, Tommy Maranges and Mac Schubert. It is licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). This adaptation turns the physical game into a room of phones: the server deals, runs the night phase, shuffles, and shows each player only what their card would show them.

## Players and roles

5 to 10 players. Each player is dealt a Secret Role (Liberal, Fascist or Hitler) and a matching Party Membership. Hitler's membership is Fascist. *Rules p.2*

| Players | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|
| Liberals | 3 | 4 | 4 | 5 | 5 | 6 |
| Fascists (not Hitler) | 1 | 1 | 2 | 2 | 3 | 3 |
| Hitler | 1 | 1 | 1 | 1 | 1 | 1 |

## Night: who knows whom

*Rules p.3*

- **5 or 6 players.** The Fascist and Hitler know each other.
- **7 to 10 players.** The Fascists know each other and know who Hitler is. Hitler knows nobody.
- Liberals know nothing.

## Policy deck

- 17 tiles: 6 Liberal and 11 Fascist, shuffled into one face-down deck. *Rules p.2*
- When fewer than 3 tiles are left in the deck at the end of a Legislative Session, they are shuffled together with the discard pile into a new deck. The leftover tiles are never revealed and never placed on top. *Rules p.5*
- The same reshuffle happens after chaos enacts the top tile, if fewer than 3 are left. *Rules p.4*
- Because both reshuffles happen as soon as the deck drops below 3, every draw of 3 and every Policy Peek sees at least 3 tiles.

## Rounds

Each round is an Election, then a Legislative Session, then an Executive Action if one was granted. *Rules p.3*

### Presidency

- The first Presidential Candidate is chosen at random. *Rules p.3*
- Each new round, the presidency passes clockwise to the next living player. In the app, clockwise means seat order, which is join order. *Rules p.3*
- A failed election also passes it clockwise. *Rules p.4*

### Nominating a Chancellor

*Rules p.3 and p.4*

- The Presidential Candidate nominates one other eligible living player.
- **Term limits.** The last *elected* President and Chancellor cannot be nominated as Chancellor. This applies to the last government elected, not the last pair nominated.
- **Five-player exception.** When only five players are left in the game, only the last elected Chancellor is ineligible. The last President may be nominated.
- Term limits only restrict the Chancellorship. Anyone can be President.

### Voting

*Rules p.4*

- Every living player votes Ja or Nein, the candidates included. Votes are revealed together once everyone has voted.
- The government is elected only by a majority of Ja votes. A tie fails.
- **Failed vote.** The Election Tracker advances by one and the presidency passes clockwise.
- **Passed vote.** The candidates become President and Chancellor, and they become the term-limited pair. If 3 or more Fascist policies are already enacted and the new Chancellor is Hitler, the Fascists win at once. Otherwise everyone now knows that Chancellor is not Hitler.

### Election Tracker and chaos

*Rules p.4*

- When the tracker reaches 3, the country is thrown into chaos. The top tile of the deck is enacted. Any power it grants is ignored. The tracker resets. Every term limit is forgotten, so every living player is eligible for the next Chancellorship.
- The tracker resets whenever any policy is enacted, by a government or by chaos.

### Legislative Session

*Rules p.4 and p.5*

- The President draws the top 3 tiles, discards 1 face down, and passes the other 2 to the Chancellor at the same time.
- The Chancellor discards 1 face down and enacts the other.
- Discards are never revealed. The President and Chancellor may say anything about them, truthfully or not.
- **5 Liberal policies:** Liberals win. **6 Fascist policies:** Fascists win. *Rules p.2*
- If the enacted Fascist policy covers a presidential power, the sitting President must use it before the next round. A Liberal policy, or a Fascist policy on an empty slot, starts the next round. *Rules p.5*

### Veto

*Rules p.6*

- Veto is unlocked once 5 Fascist policies are enacted, for every Legislative Session after that.
- After the President passes 2 tiles, the Chancellor may ask to veto instead of enacting.
- If the President agrees, both tiles are discarded, the Election Tracker advances by one, and the presidency passes clockwise.
- If the President refuses, the Chancellor must enact one of the two.

## Presidential powers

Each fascist board has 6 slots. The 6th Fascist policy wins the game. The table shows the power on each of the first 5 slots, taken from *PnP*, boards B, C and D.

| Fascist policy | 1st | 2nd | 3rd | 4th | 5th |
|---|---|---|---|---|---|
| 5 or 6 players | none | none | Policy Peek | Execution | Execution, veto unlocked |
| 7 or 8 players | none | Investigate Loyalty | Call Special Election | Execution | Execution, veto unlocked |
| 9 or 10 players | Investigate Loyalty | Investigate Loyalty | Call Special Election | Execution | Execution, veto unlocked |

Each power is used once, by the sitting President, and play waits until it is used. Powers don't stack or carry over. *Rules p.5*

- **Investigate Loyalty.** The President picks a player and secretly sees their Party Membership. Hitler shows as Fascist. No player may be investigated twice in a game. *Rules p.3 and p.5*
- **Call Special Election.** The President picks any other player to be the next Presidential Candidate, term-limited players included. That candidate nominates a Chancellor as usual. Afterwards the presidency returns to the player to the left of the President who called it. No one is skipped. If the President picks the next player in rotation, that player runs twice in a row. *Rules p.5*
- **Policy Peek.** The President secretly sees the top 3 tiles of the deck. The order doesn't change. *Rules p.5*
- **Execution.** The President executes one player. If that player is Hitler, the Liberals win at once. Otherwise the table does not learn the dead player's role. Executed players are out of the game: they may not speak, vote or run for office. *Rules p.5*

## Winning

*Rules p.2*

- **Liberals:** 5 Liberal policies enacted, or Hitler executed.
- **Fascists:** 6 Fascist policies enacted, or Hitler elected Chancellor after the 3rd Fascist policy.

## Ambiguities resolved

1. **"Only five players left."** The five-player exception counts *living* players. A 7-player game that has lost two players to execution uses it. The rulebook says "only five players left in the game", and executed players are "removed from the game".
2. **Veto and chaos.** A veto that moves the tracker to 3 sets off chaos immediately. The rulebook says a veto "advances the Election Tracker by one", and the tracker rule applies whenever it reaches 3.
3. **One veto request per session.** If the President refuses, the Chancellor can't ask again in the same session. The rulebook says the Chancellor "must enact a Policy as normal".
4. **Term limits after a veto.** A vetoed government was still elected, so its President and Chancellor become term-limited. Term limits follow the last government *elected*.
5. **A successful election doesn't reset the tracker.** Only an enacted policy does. So a veto right after two failed elections causes chaos. *Rules p.4*: "any time a new Policy tile is played face-up, the Election Tracker is reset".
6. **Chaos can end the game.** A chaos policy that is the 5th Liberal or the 6th Fascist wins, as any enacted policy does. It ignores powers, not win conditions. A chaos Fascist policy that unlocks veto still unlocks it, because veto depends only on the count.
7. **Power targets.** The President can't investigate, execute or special-elect themselves. The rulebook says "chooses a player to investigate" and "any other player" for Special Election, and executing yourself is not a meaningful move. Dead players can't be targeted: they are "removed from the game".
8. **Dead players and rotation.** Dead players are skipped when the presidency passes and are not counted in the vote majority. They can't vote or run for office.
9. **Special Election rotation.** The rotation anchor stays with the President who called it. Whether the special government is elected or fails, the next President is the next living player after that caller.
10. **First President.** Chosen at random from the seats. The rulebook says "randomly select".
11. **Hitler's mandatory reveal.** The rulebook makes Hitler announce themselves when executed or elected Chancellor after 3 Fascist policies. The app announces it instead, and ends the game.
12. **"Confirmed not Hitler."** When a Chancellor is elected after 3 Fascist policies and the game continues, everyone sees that player marked as not Hitler, because the rulebook says "other players know for sure".
13. **The table's agreements.** The rulebook bans signalling between President and Chancellor and bans random discards. The app can't police talk. It always passes both tiles at once and needs a deliberate tap on a specific tile.

## App rules (not in the rulebook)

- **Reconnecting.** A seat belongs to the device. Reloading or reopening the page puts the player back in their seat with their role and any cards in hand. A dropped connection never costs a seat, and the game waits.
- **Leaving mid-game.** A player who leaves, or whom the host removes, ends the game with no winner, and every role is shown. Secret Hitler's balance depends on every role staying at the table, so the app doesn't guess how to carry on without one. The host can then deal a new game for whoever is left.
- **Calling it off.** The host can end a running game with no winner.
