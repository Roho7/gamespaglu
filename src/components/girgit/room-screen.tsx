"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBar } from "@/components/app-bar";
import { SideDrawer } from "@/components/game/settings-drawer";
import { Deadline } from "@/components/girgit/deadline";
import { GirgitGrid } from "@/components/girgit/grid";
import { PlayerTable } from "@/components/girgit/player-table";
import { SecretHold } from "@/components/girgit/secret-hold";
import { Toast } from "@/components/girgit/toast";
import { Chip } from "@/components/mb/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colourwayVars } from "@/lib/colourways";
import { roundColourway } from "@/lib/girgit/colourway";
import type { useRoom } from "@/lib/girgit/use-room";
import { useOnline } from "@/lib/use-online";
import {
  CLUE_SECONDS_OPTIONS,
  MAX_CLUE_LENGTH,
  PACKS,
  type RoomState,
} from "@shared/protocol";

/**
 * The play surface. One label, one accent, one action in the band.
 *
 * The header is phase-driven, not theme-driven. The theme is the thing every
 * clue is judged against WHILE you are writing one, and near-irrelevant once
 * the table is arguing — so it is the headline during clues and a caption after
 * that, with the headline saying what to do or what just happened.
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
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const online = useOnline();
  const cutOff = !online || reconnecting;

  const round = state.round;
  const phase = state.phase;
  const you = state.players.find((p) => p.id === state.you);
  const isHost = you?.isHost ?? false;
  const nameOf = (id: string | null) =>
    state.players.find((p) => p.id === id)?.name ?? "someone";

  const hasClued = state.your?.hasClued ?? false;
  const hasVoted = state.your?.hasVoted ?? false;
  const colourway = roundColourway(state.code, round?.roundNo ?? 0);

  const clueOf = (playerId: string) =>
    round?.clues.find((c) => c.playerId === playerId)?.word ?? null;
  const word = (i: number | null | undefined) =>
    typeof i === "number" ? round?.cells[i] : null;

  /**
   * Headline and caption for the phase.
   *
   * The theme is deliberately never printed. Sixteen words that obviously
   * belong together state their own category better than a label does, so the
   * label only competed with the board directly beneath it — and it was
   * shouting during the vote, where it is irrelevant. The headline says what to
   * do or what just happened instead.
   */
  function headline(): { big: string; small: string } {
    const small = round ? `Round ${round.roundNo}` : "";
    switch (phase) {
      case "clues":
        return { big: "Write a clue without giving away the word", small };
      case "discuss":
        return { big: "Find the Girgit", small };
      case "vote":
        return { big: "Who is the Girgit?", small };
      case "escape":
        return {
          big: state.your?.isGirgit
            ? "Caught. Pick the word."
            : `${nameOf(round?.accused ?? null)} is guessing`,
          small,
        };
      case "reveal":
        return {
          big:
            round?.outcome === "aborted"
              ? "Round abandoned"
              : `${nameOf(round?.girgitId ?? null)} was the Girgit`,
          small,
        };
      default:
        return { big: "", small };
    }
  }
  const { big, small } = headline();

  return (
    <div style={colourwayVars(colourway)} className="flex min-h-dvh flex-col">
      <Toast message={toast} />

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
                    <li>4. Everyone writes one clue. They land on the table as they come.</li>
                    <li>5. Argue. Out loud. Then vote.</li>
                    <li>
                      6. Catch the Girgit and they get one guess at the word to
                      escape.
                    </li>
                  </ol>
                  <Link
                    href="/how-to-play/girgit"
                    className="block text-sm font-bold underline decoration-2"
                  >
                    Full rules →
                  </Link>
                </SideDrawer>

                <SideDrawer label="Room" icon="⚙" title={`Room ${state.code}`}>
                  <div className="space-y-2">
                    <p className="mb-caps text-[0.6rem] opacity-60">Word packs</p>
                    <div className="flex flex-wrap gap-2">
                      {PACKS.map((pk) => {
                        const on = state.packs.includes(pk.id);
                        return (
                          <Chip
                            key={pk.id}
                            active={on}
                            disabled={!isHost}
                            onClick={async () => {
                              const next = on
                                ? state.packs.filter((p) => p !== pk.id)
                                : [...state.packs, pk.id];
                              // Never allow zero — an empty selection is an
                              // empty deck, and the server refuses it anyway.
                              if (next.length === 0) {
                                setToast("Keep at least one pack on.");
                                return;
                              }
                              const r = await act.setPacks(next);
                              setToast(r.ok ? `${pk.label} ${on ? "off" : "on"}` : r.error.message);
                            }}
                          >
                            {pk.label}
                          </Chip>
                        );
                      })}
                    </div>
                    <p className="text-[0.7rem] opacity-70">
                      {isHost
                        ? "Applies to the next deal — this round's grid is already out."
                        : "The host picks these."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="mb-caps text-[0.6rem] opacity-60">Clue timer</p>
                    <div className="flex flex-wrap gap-2">
                      {CLUE_SECONDS_OPTIONS.map((n) => (
                        <Chip
                          key={n}
                          active={state.clueSeconds === n}
                          disabled={!isHost}
                          onClick={async () => {
                            const r = await act.setClueSeconds(n);
                            setToast(r.ok ? `Clue timer: ${n}s` : r.error.message);
                          }}
                        >
                          {n}s
                        </Chip>
                      ))}
                    </div>
                    <p className="text-[0.7rem] opacity-70">
                      {isHost
                        ? "Applies to the round already running. Only clues are timed."
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
                        End this round
                      </Button>
                      <p className="text-[0.7rem] opacity-70">
                        The vote and the guess have no clock, so this is what
                        unsticks a round nobody can finish. Nobody scores.
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
              <div className="mx-auto my-auto w-full max-w-md space-y-4">
                <header className="space-y-0.5 text-center">
                  <p className="mb-caps text-[0.55rem] opacity-60">
                    {small}
                    {reconnecting ? " · reconnecting" : ""}
                  </p>
                  <h2 className="mb-display-sm text-2xl">{big}</h2>
                </header>

                {/* The vote is the one phase the board comes off: the decision
                    is about people, and ten names must stay above the fold. */}
                {phase !== "vote" ? (
                  <GirgitGrid
                    cells={round.cells}
                    markIndex={round.secretIndex}
                    guessIndex={round.escapeGuess}
                    onPick={
                      phase === "escape" && state.your?.isGirgit
                        ? (i) => {
                            setToast(`Locked in: ${round.cells[i]}`);
                            void act.escapeGuess(i);
                          }
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

                <PlayerTable
                  players={state.players}
                  youId={state.you}
                  dimIds={round.skipped}
                  onSelect={
                    phase === "vote" && !hasVoted
                      ? (id) => {
                          setToast(`Voted for ${nameOf(id)}`);
                          void act.castVote(id);
                        }
                      : undefined
                  }
                  disabledIds={phase === "vote" ? [state.you] : []}
                  rowsRight={(p) => {
                    const clueWord = clueOf(p.id);
                    if (phase === "vote") {
                      const n = round.voteCounts[p.id] ?? 0;
                      return (
                        <span className="flex items-baseline justify-end gap-3">
                          {/* The clue stays on screen: it is the entire basis
                              for the vote, and hiding it to make room for a
                              tally made the decision guesswork. */}
                          <span className="truncate text-base font-extrabold">
                            {clueWord ?? "—"}
                          </span>
                          {round.votedBy.includes(p.id) ? (
                            <span className="mb-caps text-[0.5rem] opacity-55">
                              voted
                            </span>
                          ) : null}
                          <span className="mb-display-sm w-5 text-lg tabular-nums">
                            {n}
                          </span>
                        </span>
                      );
                    }
                    const w = clueWord;
                    if (w) return <span className="text-base font-extrabold">{w}</span>;
                    if (round.skipped.includes(p.id)) {
                      return (
                        <span className="mb-caps text-[0.5rem]">timed out</span>
                      );
                    }
                    return <span className="opacity-40">…</span>;
                  }}
                />

                {phase === "reveal" && round.outcome !== "aborted" ? (
                  <div className="space-y-2 text-center">
                    {/* The whole round hinges on this comparison, so it is
                        stated rather than implied by two highlighted cells. */}
                    {round.escapeGuess !== null ? (
                      <p className="mb-display-sm text-lg">
                        {nameOf(round.girgitId)} guessed “{word(round.escapeGuess)}”.
                        <br />
                        The word was “{word(round.secretIndex)}”.
                      </p>
                    ) : (
                      <p className="mb-display-sm text-lg">
                        The word was “{word(round.secretIndex)}”.
                      </p>
                    )}
                    <p className="mb-caps text-[0.6rem] opacity-80">
                      {round.outcome === "girgit-escaped"
                        ? "Got away with it · +2"
                        : round.outcome === "girgit-guessed"
                          ? "Caught, but guessed right · +1"
                          : "Caught cold · +1 to everyone else"}
                    </p>
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

        <div className="mb-band flex-col gap-2 px-4 py-3">
          {!cutOff && round?.deadlineAt ? (
            <Deadline
              deadlineAt={round.deadlineAt}
              totalSeconds={state.clueSeconds}
              label="Clues close in"
            />
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
                      setToast("Clue in");
                    } else {
                      setToast(r.error.message);
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
            <Button size="hero" className="max-w-sm" onClick={() => act.callVote()}>
              Call the vote
            </Button>
          ) : null}

          {!cutOff && phase === "vote" && round ? (
            <div className="flex w-full max-w-sm items-center justify-between gap-3">
              <span className="mb-caps text-[0.6rem] opacity-80">
                {hasVoted
                  ? "Locked in"
                  : `${round.votesIn} of ${round.cluesTotal} voted`}
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
              <Button size="hero" className="max-w-sm" onClick={() => act.startRound()}>
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
