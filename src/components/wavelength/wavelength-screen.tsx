"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, HelpCircle, X } from "lucide-react";
import spectrums from "@shared/data/spectrums.json";
import { Chip, IconButton } from "@/components/ui/controls";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { WavelengthDial } from "@/components/wavelength/wavelength-dial";
import { drawIndex } from "@/lib/deck/shuffle-bag";
import { usePersisted } from "@/lib/hooks/use-persisted";
import { useWakeLock } from "@/lib/hooks/use-wake-lock";
import { paletteById, paletteVars, roundPalette } from "@/lib/palettes";
import { blip, revealHit } from "@/lib/sound-and-haptics";
import {
  NEW_GAME,
  TARGET_MAX,
  TARGET_MIN,
  TOGETHER_CARDS,
  WIN_SCORE,
  isOver,
  otherTeam,
  reduce,
  verdict,
  winner,
  type Action,
  type Card,
  type Game,
  type Mode,
  type Team,
} from "@/lib/wavelength/engine";

const DECK: Card["spectrum"][] = spectrums;
const TEAM_NAME: Record<Team, string> = { a: "Team A", b: "Team B" };
const LINK = "mb-caps text-[0.65rem] underline decoration-2 underline-offset-4";

function deal(): Card {
  const spectrum = DECK[drawIndex("wavelength", DECK.length)];
  const target = TARGET_MIN + Math.random() * (TARGET_MAX - TARGET_MIN);
  return { spectrum, target: Math.round(target * 10) / 10 };
}

function BandButton({
  children,
  onClick,
  className = "flex-1",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={`mb-band-action py-10 ${className}`}>
      <StitchBorder className="inset-3" />
      <span className="mb-display-sm inline-flex items-center gap-2 text-4xl">{children}</span>
    </button>
  );
}

function Briefing({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-1">
      <StitchedPanel title="How to play" className="flex-[3] basis-0">
        <ol className="space-y-2 text-base leading-snug font-medium">
          <li>1. The Psychic holds to peek at the target. Nobody else looks.</li>
          <li>2. They say one clue out loud for where it sits between the two ends.</li>
          <li>3. Their team turns the dial to the clue and locks it in.</li>
          <li>4. Reveal. Dead centre is 4 points, then 3, then 2.</li>
        </ol>
        <nav className="mt-4">
          <Link href="/how-to-play/wavelength" className={LINK}>
            Full rules
          </Link>
        </nav>
      </StitchedPanel>
      <StitchedPanel title="Settings" className="flex-[2] basis-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip active={mode === "teams"} onClick={() => onMode("teams")}>
              Two teams
            </Chip>
            <Chip active={mode === "together"} onClick={() => onMode("together")}>
              All together
            </Chip>
          </div>
          <p className="text-sm font-medium opacity-80">
            {mode === "teams"
              ? `Teams take turns. First to ${WIN_SCORE} wins. Four or more players.`
              : `One team, ${TOGETHER_CARDS} cards, a new Psychic each card. Two or more players.`}
          </p>
        </div>
      </StitchedPanel>
    </div>
  );
}

function ScoreStrip({ game, onQuit }: { game: Game; onQuit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 pt-3">
      <p className="mb-caps text-[0.7rem]">
        {game.mode === "teams" ? (
          (["a", "b"] as const).map((t, i) => (
            <span key={t} className={t === game.turn ? "" : "opacity-55"}>
              {i ? " · " : ""}
              {t === game.turn ? "▸ " : ""}
              {TEAM_NAME[t]} {game.scores[t]}
            </span>
          ))
        ) : (
          <span>
            Card {Math.min(game.cardsPlayed + 1, TOGETHER_CARDS)} of {TOGETHER_CARDS} · {game.scores.a} pts
          </span>
        )}
      </p>
      <div className="flex gap-2">
        <Link href="/how-to-play/wavelength" aria-label="Rules" className="mb-icon-btn">
          <HelpCircle className="size-5" />
        </Link>
        <IconButton type="button" aria-label="End game" onClick={onQuit}>
          <X className="size-5" />
        </IconButton>
      </div>
    </div>
  );
}

/**
 * Wavelength on one phone. The briefing, then a loop of peek, clue, dial,
 * call and reveal. The whole game is persisted, so a refresh or a locked
 * screen resumes mid-card.
 */
export function WavelengthScreen() {
  const [game, setGame] = usePersisted<Game>("wavelength:game", NEW_GAME);
  const [peeking, setPeeking] = useState(false);
  const { phase } = game;

  useWakeLock(phase.kind !== "briefing");

  const act = (action: Action) => {
    const next = reduce(game, action);
    if (next.phase.kind === "reveal" && phase.kind !== "reveal") revealHit();
    else blip();
    setPeeking(false);
    setGame(next);
  };

  const quit = () => {
    if (phase.kind === "over" || window.confirm("End this game? The score resets.")) {
      act({ type: "reset" });
    }
  };

  const card = "card" in phase ? phase.card : null;
  const palette = card
    ? roundPalette(card.spectrum.id, card.target)
    : paletteById("miami");
  const active = TEAM_NAME[game.turn];
  const guesser = game.mode === "teams" ? active : "Everyone";

  const dial = phase.kind === "guess" || phase.kind === "call" || phase.kind === "reveal" ? phase.dial : null;
  const target =
    phase.kind === "reveal" || (phase.kind === "psychic" && peeking) ? (card?.target ?? null) : null;

  const prompt = (() => {
    switch (phase.kind) {
      case "psychic":
        return game.mode === "teams"
          ? `${active}: pick a Psychic. Everyone else, look away.`
          : "Pick a Psychic. Everyone else, look away.";
      case "guess":
        return `${guesser}: turn the dial to the clue.`;
      case "call":
        return `${TEAM_NAME[otherTeam(game.turn)]}: is the target left or right of the dial?`;
      default:
        return null;
    }
  })();

  return (
    <div style={paletteVars(palette)} className="flex h-dvh flex-col">
      <div className="mb-label mb-label-bleed flex-1">
        <div className="mb-label-field relative flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">Wavelength</h1>

          {phase.kind === "briefing" ? (
            <Briefing mode={game.mode} onMode={(mode) => act({ type: "mode", mode })} />
          ) : (
            <>
              <ScoreStrip game={game} onQuit={quit} />
              {phase.kind === "over" ? (
                <GameOver game={game} />
              ) : card ? (
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-4 px-4">
                  <p className="mb-caps min-h-8 text-center text-[0.7rem]">{prompt}</p>
                  <WavelengthDial
                    dial={dial}
                    target={target}
                    label={`${card.spectrum.left} to ${card.spectrum.right}`}
                    onMove={
                      phase.kind === "guess"
                        ? (value) => setGame(reduce(game, { type: "move", dial: value }))
                        : undefined
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <p className="mb-display-sm text-2xl leading-tight"><ArrowLeft className="inline size-[1em] align-[-0.125em]" strokeWidth={3} aria-hidden /> {card.spectrum.left}</p>
                    <p className="mb-display-sm text-right text-2xl leading-tight">{card.spectrum.right} <ArrowRight className="inline size-[1em] align-[-0.125em]" strokeWidth={3} aria-hidden /></p>
                  </div>
                  <div className="flex min-h-24 flex-col items-center justify-center gap-2">
                    {phase.kind === "psychic" ? (
                      <>
                        <button
                          type="button"
                          className="mb-btn mb-btn-secondary mb-no-dots w-full max-w-sm px-6 py-2.5 text-base select-none"
                          onPointerDown={() => setPeeking(true)}
                          onPointerUp={() => setPeeking(false)}
                          onPointerCancel={() => setPeeking(false)}
                          onPointerLeave={() => setPeeking(false)}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          {peeking ? "Let go to hide" : "Psychic: hold to peek"}
                        </button>
                        <button
                          type="button"
                          onClick={() => act({ type: "skip", card: deal() })}
                          className={LINK}
                        >
                          Skip this card
                        </button>
                      </>
                    ) : phase.kind === "reveal" ? (
                      <RevealScore game={game} />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex">
          {phase.kind === "briefing" ? (
            <BandButton onClick={() => act({ type: "start", card: deal() })}>Start</BandButton>
          ) : phase.kind === "psychic" ? (
            <BandButton onClick={() => act({ type: "clue" })}>Got a clue</BandButton>
          ) : phase.kind === "guess" ? (
            <BandButton onClick={() => act({ type: "lock" })}>Lock it in</BandButton>
          ) : phase.kind === "call" ? (
            <>
              <BandButton onClick={() => act({ type: "call", side: "left" })}><ArrowLeft className="size-[1em] shrink-0" strokeWidth={3} aria-hidden /> Left</BandButton>
              <BandButton onClick={() => act({ type: "call", side: "right" })}>Right <ArrowRight className="size-[1em] shrink-0" strokeWidth={3} aria-hidden /></BandButton>
            </>
          ) : phase.kind === "reveal" ? (
            <BandButton onClick={() => act({ type: "next", card: deal() })}>
              {isOver(game) ? "Final score" : "Next card"}
            </BandButton>
          ) : (
            <>
              <BandButton className="flex-[3]" onClick={() => act({ type: "start", card: deal() })}>
                Play again
              </BandButton>
              <BandButton className="flex-[2]" onClick={() => act({ type: "reset" })}>
                Settings
              </BandButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RevealScore({ game }: { game: Game }) {
  if (game.phase.kind !== "reveal") return null;
  const { points, call } = game.phase;
  const who = game.mode === "teams" ? `${TEAM_NAME[game.turn]} scores` : "You score";
  const caller = TEAM_NAME[otherTeam(game.turn)];
  const callLine =
    !call || points.active === 4
      ? ""
      : ` · ${caller} ${points.other ? "+1 for the call" : "called it wrong"}`;
  return (
    <div className="animate-punch text-center">
      <p className="mb-display mb-shadow text-5xl">
        {points.active ? `+${points.active}` : "Miss"}
      </p>
      <p className="mb-caps text-[0.7rem]">
        {who} {points.active || "nothing"}
        {callLine}
      </p>
    </div>
  );
}

function GameOver({ game }: { game: Game }) {
  const top = winner(game);
  return (
    <div className="animate-punch flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="mb-caps text-[0.7rem]">
        {top ? `${game.scores.a} – ${game.scores.b}` : `${game.scores.a} points from ${TOGETHER_CARDS} cards`}
      </p>
      <h2 className="mb-display mb-shadow text-6xl leading-none">
        {top ? `${TEAM_NAME[top]} wins` : verdict(game.scores.a)}
      </h2>
    </div>
  );
}
