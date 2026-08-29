"use client";

import Link from "next/link";
import { useState } from "react";
import { AppBar } from "@/components/app-bar";
import { SideDrawer } from "@/components/game/settings-drawer";
import { GirgitGrid } from "@/components/girgit/grid";
import { SecretHold } from "@/components/girgit/secret-hold";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colourwayVars } from "@/lib/colourways";
import { roundColourway } from "@/lib/girgit/colourway";
import type { useRoom } from "@/lib/girgit/use-room";
import { MAX_CLUE_LENGTH, type RoomState } from "@shared/protocol";

/**
 * The play surface. One label, one accent, one big action in the band.
 *
 * Rule 7 is doing most of the work here: everything that is not the current
 * decision — the rules, aborting, leaving — lives in a drawer, so each phase
 * shows the grid, at most one input, and the action.
 */
export function RoomScreen({
  state,
  act,
  leave,
  reconnecting,
}: {
  state: RoomState;
  act: ReturnType<typeof useRoom>["act"];
  leave: () => void;
  reconnecting: boolean;
}) {
  const [clue, setClue] = useState("");
  const round = state.round;
  const you = state.players.find((p) => p.id === state.you);
  const nameOf = (id: string | null) =>
    state.players.find((p) => p.id === id)?.name ?? "someone";

  const colourway = roundColourway(state.code, round?.roundNo ?? 0);
  // Your own clue is only in `clues` once everyone is in, so before the reveal
  // the band has to fall back to the progress count.
  const yourClue = round?.clues?.find((c) => c.playerId === state.you);
  const youVoted = round?.votes?.some((v) => v.voterId === state.you) ?? false;

  const phase = state.phase;
  const isHost = you?.isHost ?? false;

  return (
    <div style={colourwayVars(colourway)} className="flex min-h-dvh flex-col">
      <div className="mb-label mb-label-bleed flex-1">
        <div className="mb-label-field relative flex min-h-0 flex-1 flex-col">
          <AppBar
            back="/"
            title="Girgit"
            titleHidden
            extra={
              <>
                <SideDrawer label="How to play" icon="?" title="How to play">
                  <ol className="space-y-3 text-sm font-medium">
                    <li>1. Everyone sees the same 16 words and the theme.</li>
                    <li>
                      2. Everyone can see which word is the secret one — except
                      the Girgit, who only knows they are the Girgit.
                    </li>
                    <li>
                      3. Hold the button to check your word. Don&apos;t let your
                      neighbour see it.
                    </li>
                    <li>4. Everyone types one clue. They all appear at once.</li>
                    <li>5. Argue. Out loud. Then vote.</li>
                    <li>
                      6. Catch the Girgit and they get one guess at the word to
                      escape.
                    </li>
                  </ol>
                  <Link
                    href="/how-to-play"
                    className="block text-sm font-bold underline decoration-2"
                  >
                    All the guides →
                  </Link>
                </SideDrawer>

                <SideDrawer label="Room" icon="⚙" title={`Room ${state.code}`}>
                  <div className="space-y-2">
                    <p className="mb-caps text-[0.6rem] opacity-60">Players</p>
                    <ul className="space-y-1 text-sm font-semibold">
                      {state.players.map((p) => (
                        <li
                          key={p.id}
                          className={p.connected ? "" : "opacity-50"}
                        >
                          {p.name}
                          {p.id === state.you ? " (you)" : ""}
                          {p.isHost ? " · host" : ""}
                          {p.connected ? "" : " · away"}
                          <span className="opacity-60"> — {p.score}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isHost && phase !== "lobby" && phase !== "reveal" ? (
                    <div className="space-y-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => act.abortRound()}
                      >
                        Abort this round
                      </Button>
                      <p className="text-[0.7rem] opacity-70">
                        For when somebody has actually gone home. Nobody scores;
                        deal again.
                      </p>
                    </div>
                  ) : null}

                  <Button variant="tertiary" size="sm" onClick={leave}>
                    Leave the room
                  </Button>
                </SideDrawer>
              </>
            }
          />

          {/* flex-col so the lobby can actually centre itself; h-full alone
              does not resolve inside a flex-1 scroll container. */}
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-16 pb-2">
            {phase === "lobby" || !round ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="mb-caps text-[0.6rem] opacity-70">
                  Everyone taps Join and types this
                </p>
                <p className="mb-display mb-shadow text-6xl tracking-[0.12em]">
                  {state.code}
                </p>
                <p className="mb-caps text-[0.6rem] opacity-70">
                  {state.players.length} of {state.maxPlayers} in
                  {state.players.length < state.minPlayers
                    ? ` · need ${state.minPlayers}`
                    : ""}
                </p>
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm font-bold">
                  {state.players.map((p) => (
                    <li key={p.id} className={p.connected ? "" : "opacity-40"}>
                      {p.name}
                      {p.isHost ? " ★" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              // my-auto so a short phase sits centred rather than piled at the
              // top with half a screen of field under it.
              <div className="my-auto w-full space-y-3">
                <div className="flex items-baseline justify-between">
                  <p className="mb-caps text-[0.6rem] opacity-70">
                    {round.theme}
                  </p>
                  <p className="mb-caps text-[0.55rem] opacity-50">
                    Round {round.roundNo}
                    {reconnecting ? " · reconnecting" : ""}
                  </p>
                </div>

                {/* The vote is the one screen the grid comes off, so ten names
                    stay above the fold instead of below it. */}
                {phase !== "vote" ? (
                  <GirgitGrid
                    cells={round.cells}
                    markIndex={round.secretIndex}
                    onPick={
                      phase === "escape" && state.your?.isGirgit
                        ? (i) => act.escapeGuess(i)
                        : undefined
                    }
                  />
                ) : null}

                {phase === "clues" && state.your ? (
                  <SecretHold
                    isGirgit={state.your.isGirgit}
                    word={
                      state.your.secretIndex === null
                        ? null
                        : round.cells[state.your.secretIndex]
                    }
                  />
                ) : null}

                {round.clues ? (
                  <ul className="space-y-1">
                    {round.clues.map((c) => (
                      <li
                        key={c.playerId}
                        className="flex items-baseline justify-between gap-3 border-b-[var(--rule-thin)] border-current/25 pb-1"
                      >
                        <span className="text-base font-extrabold">
                          {c.word}
                        </span>
                        <span className="mb-caps text-[0.55rem] opacity-70">
                          {nameOf(c.playerId)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {phase === "vote" ? (
                  <div className="space-y-2">
                    <p className="mb-caps text-center text-[0.6rem] opacity-70">
                      {youVoted ? "Locked in" : "Who is the Girgit?"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {state.players
                        .filter((p) => p.id !== state.you)
                        .map((p) => (
                          <Button
                            key={p.id}
                            variant="secondary"
                            onClick={() => act.castVote(p.id)}
                            disabled={youVoted}
                          >
                            {p.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : null}

                {phase === "escape" ? (
                  <p className="mb-display-sm text-center text-lg">
                    {state.your?.isGirgit
                      ? "Caught. Tap the word to escape."
                      : `${nameOf(round.accused)} is guessing…`}
                  </p>
                ) : null}

                {phase === "reveal" ? (
                  <div className="space-y-2 text-center">
                    <p className="mb-display-sm text-xl">
                      {round.outcome === "aborted"
                        ? "Round aborted."
                        : `${nameOf(round.girgitId)} was the Girgit.`}
                    </p>
                    {round.outcome && round.outcome !== "aborted" ? (
                      <p className="mb-caps text-[0.6rem] opacity-80">
                        {round.outcome === "girgit-escaped"
                          ? "Got away with it · +2"
                          : round.outcome === "girgit-guessed"
                            ? "Caught, but guessed the word · +1"
                            : "Caught cold · +1 to everyone else"}
                      </p>
                    ) : null}
                    {round.votes ? (
                      <ul className="mb-caps space-y-0.5 text-[0.55rem] opacity-70">
                        {round.votes.map((v) => (
                          <li key={v.voterId}>
                            {nameOf(v.voterId)} → {nameOf(v.targetId)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <ul className="flex flex-wrap justify-center gap-x-3 text-sm font-bold">
                      {state.players.map((p) => (
                        <li key={p.id}>
                          {p.name} {p.score}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* The band. Exactly one action, at thumb height, never scrolled away. */}
        <div className="mb-band flex-col gap-1.5 px-4 py-3">
          {phase === "lobby" || !round ? (
            isHost ? (
              <Button
                size="hero"
                className="max-w-sm"
                onClick={() => act.startRound()}
                disabled={state.players.length < state.minPlayers}
              >
                {state.players.length < state.minPlayers
                  ? `Need ${state.minPlayers} players`
                  : "Deal"}
              </Button>
            ) : (
              <p className="mb-caps text-center text-[0.6rem] opacity-80">
                Waiting for {nameOf(state.hostId)} to deal
              </p>
            )
          ) : null}

          {phase === "clues" && round ? (
            yourClue ? (
              <p className="mb-caps text-center text-[0.6rem] opacity-80">
                Waiting on {round.cluesTotal - round.cluesIn} of{" "}
                {round.cluesTotal}
              </p>
            ) : (
              <div className="flex w-full max-w-sm items-center gap-2">
                <Input
                  value={clue}
                  maxLength={MAX_CLUE_LENGTH}
                  onChange={(e) => setClue(e.target.value)}
                  placeholder="One or two words"
                  autoComplete="off"
                  className="flex-1"
                />
                <Button
                  onClick={async () => {
                    const r = await act.submitClue(clue);
                    if (r.ok) setClue("");
                  }}
                  disabled={!clue.trim()}
                >
                  Send
                </Button>
              </div>
            )
          ) : null}

          {phase === "discuss" ? (
            <Button
              size="hero"
              className="max-w-sm"
              onClick={() => act.callVote()}
            >
              Call the vote
            </Button>
          ) : null}

          {phase === "vote" && round ? (
            <p className="mb-caps text-center text-[0.6rem] opacity-80">
              {round.votesIn} of {round.cluesTotal} voted
            </p>
          ) : null}

          {phase === "escape" ? (
            <p className="mb-caps text-center text-[0.6rem] opacity-80">
              {state.your?.isGirgit ? "Pick a word above" : "Hold your breath"}
            </p>
          ) : null}

          {phase === "reveal" ? (
            isHost ? (
              <Button
                size="hero"
                className="max-w-sm"
                onClick={() => act.startRound()}
              >
                Again
              </Button>
            ) : (
              <p className="mb-caps text-center text-[0.6rem] opacity-80">
                Waiting for {nameOf(state.hostId)}
              </p>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
