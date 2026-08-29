"use client";

import { useState } from "react";
import { AppBar } from "@/components/app-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoom } from "@/lib/girgit/use-room";
import {
  MAX_CLUE_LENGTH,
  MAX_NAME_LENGTH,
  ROOM_CODE_LENGTH,
  type PublicRound,
  type RoomState,
} from "@shared/protocol";

/**
 * M3 — a full round, deliberately unstyled. M4 puts it on the matchbox system.
 *
 * The one piece of real design here is hold-to-reveal, because it is the
 * mechanic the whole game rests on: a persistent highlight is readable by
 * POSITION from across a table, so the secret is shown as type in a fixed slot
 * and only while a finger is down. The Girgit's screen renders the same shape.
 */
function HoldToReveal({ state, round }: { state: RoomState; round: PublicRound }) {
  const [held, setHeld] = useState(false);
  const your = state.your;
  if (!your) return null;

  const word =
    your.secretIndex === null ? "YOU'RE THE GIRGIT" : round.cells[your.secretIndex];

  return (
    <div className="space-y-1">
      <button
        className="mb-btn mb-btn-secondary w-full select-none"
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        Hold to see your word
      </button>
      {/* A fixed slot, same size whether it is a word or the Girgit line — a
          neighbour has to read it rather than clock which square lit up. */}
      <p className="mb-display-sm min-h-8 text-center">{held ? word : " "}</p>
    </div>
  );
}

function Grid({
  cells,
  onPick,
  markIndex,
}: {
  cells: string[];
  onPick?: (i: number) => void;
  markIndex?: number | null;
}) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {cells.map((c, i) => (
        <button
          key={`${c}-${i}`}
          disabled={!onPick}
          onClick={() => onPick?.(i)}
          className={`min-h-12 border p-1 text-[0.65rem] leading-tight ${
            markIndex === i ? "font-extrabold underline" : ""
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export default function GirgitPage() {
  const { state, status, error, create, join, leave, kick, act } = useRoom();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [clue, setClue] = useState("");

  const you = state?.players.find((p) => p.id === state.you);
  const round = state?.round ?? null;
  const nameOf = (id: string) =>
    state?.players.find((p) => p.id === id)?.name ?? "someone";

  return (
    <main className="min-h-dvh p-4 pb-28">
      <AppBar />
      <h1 className="mb-display-sm mt-4">Girgit</h1>
      <p className="mb-caps text-[0.65rem] opacity-60">M3 — playable, unstyled</p>

      {error ? (
        <p className="mt-3 text-sm font-bold">
          {error.message} <span className="opacity-50">({error.code})</span>
        </p>
      ) : null}

      {!state ? (
        <div className="mt-6 space-y-4">
          <Input
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Button onClick={() => create(name)} disabled={!name.trim()}>
            Start a room
          </Button>
          <div className="flex items-end gap-2">
            <Input
              value={code}
              maxLength={ROOM_CODE_LENGTH}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
            />
            <Button
              onClick={() => join(name, code)}
              disabled={!name.trim() || code.length !== ROOM_CODE_LENGTH}
            >
              Join
            </Button>
          </div>
          {status === "connecting" ? <p className="text-sm">Connecting…</p> : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="mb-display-sm">{state.code}</span>
            <span className="mb-caps text-[0.6rem] opacity-60">
              {state.phase}
              {status === "connecting" ? " · reconnecting" : ""}
            </span>
          </div>

          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {state.players.map((p) => (
              <li key={p.id} className={p.connected ? "" : "opacity-40"}>
                {p.name}
                {p.id === state.you ? " (you)" : ""}
                {p.isHost ? "*" : ""} · {p.score}
                {p.connected ? "" : " · away"}
                {you?.isHost && p.id !== state.you ? (
                  <button
                    className="mb-caps ml-1 text-[0.5rem] underline opacity-60"
                    onClick={() => kick(p.id)}
                  >
                    remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          {!round || state.phase === "lobby" || round.outcome ? (
            you?.isHost ? (
              <Button
                onClick={() => act.startRound()}
                disabled={state.players.length < state.minPlayers}
              >
                {round?.outcome ? "Next round" : "Start round"}
                {state.players.length < state.minPlayers
                  ? ` — need ${state.minPlayers}`
                  : ""}
              </Button>
            ) : (
              <p className="text-sm opacity-70">Waiting for the host…</p>
            )
          ) : null}

          {round ? (
            <div className="space-y-3">
              <p className="mb-caps text-[0.6rem] opacity-60">
                Round {round.roundNo} · {round.theme}
              </p>

              <Grid
                cells={round.cells}
                markIndex={round.secretIndex}
                onPick={
                  state.phase === "escape" && state.your?.isGirgit
                    ? (i) => act.escapeGuess(i)
                    : undefined
                }
              />

              {state.phase !== "reveal" ? (
                <HoldToReveal state={state} round={round} />
              ) : null}

              {state.phase === "clues" ? (
                <div className="space-y-2">
                  <p className="mb-caps text-[0.6rem] opacity-60">
                    Waiting on {round.cluesTotal - round.cluesIn} of {round.cluesTotal}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={clue}
                      maxLength={MAX_CLUE_LENGTH}
                      onChange={(e) => setClue(e.target.value)}
                      placeholder="One or two words"
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
                </div>
              ) : null}

              {round.clues ? (
                <ul className="space-y-1 text-sm">
                  {round.clues.map((c) => (
                    <li key={c.playerId}>
                      <b>{c.word}</b>{" "}
                      <span className="opacity-60">— {nameOf(c.playerId)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {state.phase === "discuss" ? (
                <Button onClick={() => act.callVote()}>Call the vote</Button>
              ) : null}

              {state.phase === "vote" ? (
                <div className="space-y-2">
                  <p className="mb-caps text-[0.6rem] opacity-60">
                    {round.votesIn} of {round.cluesTotal} voted
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {state.players
                      .filter((p) => p.id !== state.you)
                      .map((p) => (
                        <Button key={p.id} onClick={() => act.castVote(p.id)}>
                          {p.name}
                        </Button>
                      ))}
                  </div>
                </div>
              ) : null}

              {state.phase === "escape" ? (
                <p className="text-sm font-bold">
                  {state.your?.isGirgit
                    ? "You were caught. Tap the secret word to escape."
                    : `${nameOf(round.accused ?? "")} was caught — and is guessing…`}
                </p>
              ) : null}

              {state.phase === "reveal" ? (
                <div className="space-y-2 text-sm">
                  <p className="font-bold">
                    {round.outcome === "aborted"
                      ? "Round aborted."
                      : `${nameOf(round.girgitId ?? "")} was the Girgit. The word was ${
                          round.cells[round.secretIndex ?? 0]
                        }.`}
                  </p>
                  {round.outcome && round.outcome !== "aborted" ? (
                    <p className="opacity-70">
                      {round.outcome === "girgit-escaped"
                        ? "Not caught. +2."
                        : round.outcome === "girgit-guessed"
                          ? "Caught, but guessed the word. +1."
                          : "Caught, and guessed wrong. +1 to everyone else."}
                    </p>
                  ) : null}
                  {round.votes ? (
                    <ul className="opacity-70">
                      {round.votes.map((v) => (
                        <li key={v.voterId}>
                          {nameOf(v.voterId)} → {nameOf(v.targetId)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {you?.isHost && state.phase !== "reveal" ? (
                <button
                  className="mb-caps text-[0.55rem] underline opacity-60"
                  onClick={() => act.abortRound()}
                >
                  abort round
                </button>
              ) : null}
            </div>
          ) : null}

          <Button onClick={leave}>Leave</Button>
        </div>
      )}
    </main>
  );
}
