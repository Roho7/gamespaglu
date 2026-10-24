"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BandButton } from "@/components/layout/band-button";
import { PageCorners } from "@/components/layout/page-corners";
import { SideDrawer } from "@/components/layout/side-drawer";
import { PhaseCountdown } from "@/components/girgit/phase-countdown";
import { GirgitRules } from "@/components/girgit/room-panels";
import { GirgitGrid } from "@/components/girgit/girgit-grid";
import { ClueBoard, type ClueSlip } from "@/components/girgit/clue-board";
import { HoldToRevealSecret } from "@/components/girgit/hold-to-reveal-secret";
import { TapToast } from "@/components/girgit/tap-toast";
import { Chip } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paletteById, roundPalette, theme } from "@/lib/palettes";
import { DitheredPhoto } from "@/components/home/dithered-photo";
import type { GirgitRoom } from "@/lib/hooks/use-girgit-room";
import { useOnline } from "@/lib/hooks/use-online";
import {
  CLUE_SECONDS_OPTIONS,
  MAX_CLUE_LENGTH,
  PACKS,
  SCORE_GIRGIT_ESCAPED,
  SCORE_GIRGIT_GUESSED,
  SCORE_INNOCENT,
  type RoomState,
} from "@shared/protocol";

const GIRGIT_PALETTE = paletteById("jungle");

/** The photo behind the waiting room, dithered in Girgit's palette. */
const LOBBY_IMAGE = "/backgrounds/chameleon.jpg";

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
  act: GirgitRoom["act"];
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
  const lobby = phase === "lobby" || !round;
  const short = state.players.length < state.minPlayers;
  const palette = lobby
    ? GIRGIT_PALETTE
    : roundPalette(state.code, round.roundNo);

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

  const won = (id: string): number => {
    const girgit = id === round?.girgitId;
    switch (round?.outcome) {
      case "girgit-escaped":
        return girgit ? SCORE_GIRGIT_ESCAPED : 0;
      case "girgit-guessed":
        return girgit ? SCORE_GIRGIT_GUESSED : 0;
      case "girgit-caught":
        return girgit ? 0 : SCORE_INNOCENT;
      default:
        return 0;
    }
  };

  const slips: ClueSlip[] = state.players.map((p) => {
    const revealed = phase === "reveal" && round?.outcome !== "aborted";
    const skipped = round?.skipped.includes(p.id) ?? false;
    const votes = round?.voteCounts[p.id] ?? 0;
    return {
      id: p.id,
      name: p.name,
      clue: clueOf(p.id),
      you: p.id === state.you,
      away: !p.connected,
      dim: skipped,
      marked: revealed && p.id === round?.girgitId,
      badge: revealed
        ? won(p.id) > 0
          ? `+${won(p.id)}`
          : null
        : phase === "vote" && votes > 0
          ? `${votes}`
          : null,
      note: revealed
        ? `${p.id === round?.girgitId ? "Girgit · " : ""}${p.score} ${p.score === 1 ? "pt" : "pts"}`
        : skipped
          ? "timed out"
          : phase === "vote" && round?.votedBy.includes(p.id)
            ? "voted"
            : undefined,
    };
  });

  return (
    <div {...theme(palette)} className="flex h-dvh flex-col">
      <TapToast message={toast} />

      <div className="mb-label mb-label-bleed min-h-0 flex-1">
        {lobby ? null : (
          <PaletteGrain
            palette={palette}
            tone="ink"
            className="absolute inset-0"
          />
        )}
        <div
          {...theme(palette, { flipped: !lobby })}
          className="mb-label-field relative flex min-h-0 flex-1 flex-col"
        >
          <h1 className="sr-only">Girgit</h1>
          {lobby ? (
            <DitheredPhoto
              image={LOBBY_IMAGE}
              palette={GIRGIT_PALETTE}
              className="absolute inset-0 opacity-60"
            />
          ) : null}
          <PageCorners
            extra={
              <>
                <SideDrawer
                  label="How to play"
                  icon="?"
                  title="How to play"
                  className="mb-square-btn mb-display-sm text-2xl"
                >
                  <GirgitRules />
                </SideDrawer>

                <SideDrawer
                  label="Room"
                  icon={
                    <Settings
                      className="size-5"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  }
                  title={`Room ${state.code}`}
                  className="mb-square-btn"
                >
                  <div className="space-y-2">
                    <p className="mb-caps text-[0.6rem] opacity-60">
                      Word packs
                    </p>
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
                              if (next.length === 0) {
                                setToast("Keep at least one pack on.");
                                return;
                              }
                              const r = await act.setPacks(next);
                              setToast(
                                r.ok
                                  ? `${pk.label} ${on ? "off" : "on"}`
                                  : r.error.message,
                              );
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
                    <p className="mb-caps text-[0.6rem] opacity-60">
                      Clue timer
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CLUE_SECONDS_OPTIONS.map((n) => (
                        <Chip
                          key={n}
                          active={state.clueSeconds === n}
                          disabled={!isHost}
                          onClick={async () => {
                            const r = await act.setClueSeconds(n);
                            setToast(
                              r.ok ? `Clue timer: ${n}s` : r.error.message,
                            );
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
            {lobby ? (
              <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 text-center">
                <p className="mb-caps text-sm">
                  SHARE THIS WITH YOUR TEAMMATES
                </p>
                <p className="mb-display mb-shadow text-7xl tracking-[0.12em]">
                  {state.code}
                </p>
                <p className="mb-caps text-sm]">
                  {state.players.length} of {state.maxPlayers} in
                  {short ? ` · need ${state.minPlayers}` : ""}
                </p>
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-base font-bold">
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

                {phase === "reveal" && round.outcome !== "aborted" ? (
                  <div className="space-y-2 text-center">
                    {round.escapeGuess !== null ? (
                      <p className="mb-display-sm text-lg">
                        {nameOf(round.girgitId)} guessed “
                        {word(round.escapeGuess)}”.
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
                        ? `Got away with it · +${SCORE_GIRGIT_ESCAPED}`
                        : round.outcome === "girgit-guessed"
                          ? `Caught, but guessed right · +${SCORE_GIRGIT_GUESSED}`
                          : `Caught cold · +${SCORE_INNOCENT} to everyone else`}
                    </p>
                  </div>
                ) : null}

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
                  <HoldToRevealSecret
                    isGirgit={state.your.isGirgit}
                    word={
                      state.your.secretIndex === null
                        ? null
                        : round.cells[state.your.secretIndex]
                    }
                  />
                ) : null}

                <ClueBoard
                  slips={slips}
                  onSelect={
                    phase === "vote" && !hasVoted
                      ? (id) => {
                          setToast(`Voted for ${nameOf(id)}`);
                          void act.castVote(id);
                        }
                      : undefined
                  }
                  disabledIds={phase === "vote" ? [state.you] : []}
                />

              </div>
            )}
          </div>
        </div>

        {!cutOff && lobby ? (
          <div className="relative flex">
            {isHost ? (
              <BandButton
                onClick={() => act.startRound()}
                disabled={short}
                detail={short ? `Need ${state.minPlayers} players` : undefined}
              >
                Start
              </BandButton>
            ) : (
              <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">
                Waiting for host to start…
              </p>
            )}
          </div>
        ) : !cutOff && phase === "discuss" ? (
          <div className="relative flex">
            <BandButton onClick={() => act.callVote()}>Call the vote</BandButton>
          </div>
        ) : !cutOff && phase === "reveal" && isHost ? (
          <div className="relative flex">
            <BandButton onClick={() => act.startRound()}>Again</BandButton>
          </div>
        ) : (
          <div className="mb-band relative flex-col gap-2 px-4 py-3">
            {!cutOff && round?.deadlineAt ? (
              <PhaseCountdown
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
                  {state.your?.isGirgit
                    ? "Pick a word above"
                    : "Hold your breath"}
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
              <p className="mb-caps text-center text-[0.6rem] opacity-80">
                Waiting for {nameOf(state.hostId)}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
