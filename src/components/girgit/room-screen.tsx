"use client";

import Link from "next/link";
import { useState } from "react";
import { AppBar } from "@/components/app-bar";
import { SideDrawer } from "@/components/game/settings-drawer";
import { Deadline } from "@/components/girgit/deadline";
import { GirgitGrid } from "@/components/girgit/grid";
import { Roster } from "@/components/girgit/roster";
import { SecretHold } from "@/components/girgit/secret-hold";
import { Chip } from "@/components/mb/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colourwayVars } from "@/lib/colourways";
import { roundColourway } from "@/lib/girgit/colourway";
import { useOnline } from "@/lib/use-online";
import type { useRoom } from "@/lib/girgit/use-room";
import {
  CLUE_SECONDS_OPTIONS,
  MAX_CLUE_LENGTH,
  type Err,
  type RoomState,
} from "@shared/protocol";

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
  // A rejected action used to fail in total silence here — you tapped, nothing
  // happened, and there was no way to tell a bad clue from a broken game.
  const [actionError, setActionError] = useState<Err | null>(null);
  const online = useOnline();
  // Offline or merely disconnected, the effect is the same: this phone is not
  // talking to the game. The service worker will happily serve this screen from
  // cache, so without this it would look completely fine and do nothing —
  // which is the worst failure a room screen can have.
  const cutOff = !online || reconnecting;
  const round = state.round;
  const you = state.players.find((p) => p.id === state.you);
  const nameOf = (id: string | null) =>
    state.players.find((p) => p.id === id)?.name ?? "someone";

  const colourway = roundColourway(state.code, round?.roundNo ?? 0);
  // Your own clue is only in `clues` once everyone is in, so before the reveal
  // the band has to fall back to the progress count.
  // From the private half, so it is known the moment you act rather than only
  // once every clue is in and the public list appears.
  const hasClued = state.your?.hasClued ?? false;
  const hasVoted = state.your?.hasVoted ?? false;

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

                  <div className="space-y-2">
                    <p className="mb-caps text-[0.6rem] opacity-60">Clue timer</p>
                    <div className="flex flex-wrap gap-2">
                      {CLUE_SECONDS_OPTIONS.map((n) => (
                        <Chip
                          key={n}
                          active={state.clueSeconds === n}
                          // Rule 4: a chip a non-host can tap and have nothing
                          // happen is worse than one they cannot tap.
                          disabled={!isHost}
                          onClick={async () => {
                            const r = await act.setClueSeconds(n);
                            if (!r.ok) setActionError(r.error);
                          }}
                        >
                          {n}s
                        </Chip>
                      ))}
                    </div>
                    <p className="text-[0.7rem] opacity-70">
                      {isHost
                        ? "Applies to the round already running. Only clues are timed — the vote and the guess are not."
                        : "The host sets this."}
                    </p>
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
                        For when somebody has actually gone home. The vote and
                        the guess have no clock, so this is what unsticks a round
                        nobody can finish. Nobody scores; deal again.
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
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-16 pb-3 sm:px-8">
            {phase === "lobby" || !round ? (
              <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 text-center">
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
              // Centred and capped. On a wide screen the grid used to stretch
              // edge to edge with the clues stranded in the corners; the table
              // is meant to have a centrepiece.
              <div className="mx-auto my-auto w-full max-w-md space-y-4">
                {/* The round call-out. It was a 10px caption; it is the one
                    piece of context every clue is judged against. */}
                <header className="space-y-0.5 text-center">
                  <p className="mb-caps text-[0.55rem] opacity-60">
                    Round {round.roundNo}
                    {reconnecting ? " · reconnecting" : ""}
                  </p>
                  <h2 className="mb-display-sm text-2xl">{round.theme}</h2>
                </header>

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

                {phase === "clues" ? (
                  <Roster
                    players={state.players}
                    doneIds={round.cluedBy}
                    youId={state.you}
                  />
                ) : null}

                {phase === "vote" ? (
                  <Roster
                    players={state.players}
                    doneIds={round.votedBy}
                    youId={state.you}
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
                  // The thing everybody is actually looking at. Laid out like
                  // cards on a table rather than a list of rows.
                  <ul className="grid grid-cols-2 gap-2">
                    {round.clues.map((c) => (
                      <li
                        key={c.playerId}
                        className="flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] border-[length:var(--rule-thin)] border-[color:var(--frame)] px-2 py-3 text-center"
                      >
                        <span className="mb-display-sm text-lg leading-tight break-words">
                          {c.word}
                        </span>
                        <span className="mb-caps text-[0.5rem] opacity-70">
                          {nameOf(c.playerId)}
                        </span>
                      </li>
                    ))}
                    {round.skipped.map((id) => (
                      <li
                        key={id}
                        className="flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] border-[length:var(--rule-thin)] border-current/30 px-2 py-3 text-center opacity-50"
                      >
                        <span className="mb-display-sm text-lg leading-tight">—</span>
                        <span className="mb-caps text-[0.5rem]">
                          {nameOf(id)} · timed out
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {phase === "vote" ? (
                  <div className="space-y-2">
                    <p className="mb-caps text-center text-[0.6rem] opacity-70">
                      {hasVoted ? "Locked in — waiting" : "Who is the Girgit?"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {state.players
                        .filter((p) => p.id !== state.you)
                        .map((p) => (
                          <Button
                            key={p.id}
                            variant="secondary"
                            onClick={async () => {
                              const r = await act.castVote(p.id);
                              if (!r.ok) setActionError(r.error);
                            }}
                            disabled={hasVoted}
                          >
                            {p.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : null}

                {!cutOff && phase === "escape" ? (
                  <p className="mb-display-sm text-center text-lg">
                    {state.your?.isGirgit
                      ? "Caught. Tap the word to escape."
                      : `${nameOf(round.accused)} is guessing…`}
                  </p>
                ) : null}

                {!cutOff && phase === "reveal" ? (
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
        <div className="mb-band flex-col gap-2 px-4 py-3">
          {!cutOff && round?.deadlineAt ? (
            <Deadline
              deadlineAt={round.deadlineAt}
              totalSeconds={state.clueSeconds}
              label="Clues close in"
            />
          ) : null}

          {actionError ? (
            <p className="text-center text-xs font-bold">{actionError.message}</p>
          ) : null}

          {cutOff ? (
            <div className="text-center">
              <p className="mb-display-sm text-base">
                {online ? "Reconnecting…" : "No signal"}
              </p>
              <p className="mb-caps text-[0.55rem] opacity-70">
                Your seat and your word are held. Nothing is lost.
              </p>
            </div>
          ) : null}

          {!cutOff && (phase === "lobby" || !round) ? (
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

          {!cutOff && phase === "clues" && round ? (
            hasClued ? (
              <p className="mb-caps text-center text-[0.6rem] opacity-80">
                In. Waiting on {round.cluesTotal - round.cluesIn} of{" "}
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
                    if (r.ok) {
                      setClue("");
                      setActionError(null);
                    } else {
                      setActionError(r.error);
                    }
                  }}
                  disabled={!clue.trim()}
                >
                  Send
                </Button>
              </div>
            )
          ) : null}

          {!cutOff && phase === "discuss" ? (
            <Button
              size="hero"
              className="max-w-sm"
              onClick={() => act.callVote()}
            >
              Call the vote
            </Button>
          ) : null}

          {!cutOff && phase === "vote" && round ? (
            <div className="flex w-full max-w-sm items-center justify-between gap-3">
              <span className="mb-caps text-[0.6rem] opacity-80">
                {round.votesIn} of {round.cluesTotal} voted
              </span>
              {/* Untimed phases cannot unstick themselves, so the escape hatch
                  is on the surface rather than three taps into a drawer. */}
              {isHost ? (
                <button
                  className="mb-caps text-[0.55rem] underline opacity-70"
                  onClick={() => act.abortRound()}
                >
                  end round
                </button>
              ) : null}
            </div>
          ) : null}

          {!cutOff && phase === "escape" ? (
            <div className="flex w-full max-w-sm items-center justify-between gap-3">
              <span className="mb-caps text-[0.6rem] opacity-80">
                {state.your?.isGirgit ? "Pick a word above" : "Hold your breath"}
              </span>
              {isHost ? (
                <button
                  className="mb-caps text-[0.55rem] underline opacity-70"
                  onClick={() => act.abortRound()}
                >
                  end round
                </button>
              ) : null}
            </div>
          ) : null}

          {!cutOff && phase === "reveal" ? (
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
