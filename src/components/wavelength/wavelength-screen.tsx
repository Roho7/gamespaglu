"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import spectrums from "@shared/data/spectrums.json";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BandButton } from "@/components/layout/band-button";
import { HelpLink } from "@/components/layout/page-corners";
import { MarqueeBanner } from "@/components/layout/marquee-banner";
import { ScoreboardDrawer } from "@/components/scoreboard/scoreboard-drawer";
import { Input } from "@/components/ui/input";
import { WavelengthBriefing } from "@/components/wavelength/wavelength-briefing";
import { WavelengthDial } from "@/components/wavelength/wavelength-dial";
import {
  WavelengthPlayers,
  rosterFromScoreboard,
  seatsFor,
  type RosterPlayer,
} from "@/components/wavelength/wavelength-players";
import { drawIndex } from "@/lib/deck/shuffle-bag";
import { usePersisted } from "@/lib/hooks/use-persisted";
import { addPoints, useScoreboard } from "@/lib/hooks/use-scoreboard";
import { useWakeLock } from "@/lib/hooks/use-wake-lock";
import { paletteById, roundPalette, theme } from "@/lib/palettes";
import { blip, revealHit } from "@/lib/sound-and-haptics";
import {
  BULLSEYE,
  CLUE_MAX,
  NEW_GAME,
  TARGET_MAX,
  TARGET_MIN,
  isLastTurn,
  leaders,
  reduce,
  roles,
  rolesAt,
  rosterProblem,
  roundOf,
  type Action,
  type Card,
  type Game,
  type Seat,
} from "@/lib/wavelength/engine";

const DECK: Card["spectrum"][] = spectrums;
const LINK = "mb-caps text-sm underline decoration-2 underline-offset-4";

function deal(): Card {
  const spectrum = DECK[drawIndex("wavelength", DECK.length)];
  const target = TARGET_MIN + Math.random() * (TARGET_MAX - TARGET_MIN);
  return { spectrum, target: Math.round(target * 10) / 10 };
}

/** What the marquee says: whose turn it is and who holds the phone. */
function bannerFor(game: Game): { headline: string; detail: string } | null {
  const { phase } = game;
  if (!("card" in phase)) return null;
  const { active, peeker, guessers, caller } = roles(game);
  switch (phase.kind) {
    case "psychic":
      if (game.mode === "guesser")
        return {
          headline: `${active.name}, look away`,
          detail: "Everyone else: hold the dial and agree a clue.",
        };
      if (game.mode === "teams")
        return {
          headline: `${active.name}'s turn`,
          detail: `Pass the phone to ${peeker}, the Psychic. Everyone else, look away.`,
        };
      return {
        headline: `Pass the phone to ${peeker}`,
        detail: `${peeker} is the Psychic. Everyone else, look away.`,
      };
    case "guess": {
      if (game.mode === "psychic") {
        const next = guessers[phase.guesses.length];
        return {
          headline: `Pass the phone to ${next.name}`,
          detail: `Guess ${phase.guesses.length + 1} of ${guessers.length}. Turn the dial in secret.`,
        };
      }
      return {
        headline: `${active.name}'s turn to guess`,
        detail:
          game.mode === "teams"
            ? "Talk it over, then turn the dial."
            : "Turn the dial to the clue.",
      };
    }
    case "call":
      return {
        headline: `${caller?.name}: left or right?`,
        detail: `Is the target left or right of ${active.name}'s dial?`,
      };
    case "reveal": {
      if (isLastTurn(game))
        return { headline: "Last card", detail: "Tap for the final score." };
      const next = rolesAt(game, game.turn + 1);
      if (game.mode === "teams")
        return {
          headline: `Next up: ${next.active.name}`,
          detail: `${next.peeker} is their Psychic.`,
        };
      return game.mode === "guesser"
        ? {
            headline: `Next up: ${next.active.name}`,
            detail: `${next.active.name} guesses the next card.`,
          }
        : {
            headline: `Next up: ${next.peeker}`,
            detail: `${next.peeker} is the next Psychic.`,
          };
    }
  }
}

function ScoreStrip({
  game,
  scoreOf,
  onQuit,
}: {
  game: Game;
  scoreOf: (id: string) => number;
  onQuit: () => void;
}) {
  const over = game.phase.kind === "over";
  const active = over ? null : roles(game).active.id;
  return (
    <div className="flex items-center justify-between gap-2 px-3 pt-3">
      <div className="mb-caps min-w-0 text-[0.7rem] leading-relaxed">
        <p>
          {over
            ? `${game.rounds} ${game.rounds === 1 ? "round" : "rounds"} played`
            : `Round ${roundOf(game)} of ${game.rounds}`}
        </p>
        {game.mode === "teams" ? (
          <p>
            {game.seats.map((s, i) => (
              <span
                key={s.id}
                className={s.id === active || over ? "" : "opacity-55"}
              >
                {i ? " · " : ""}
                {s.name} {scoreOf(s.id)}
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <HelpLink href="/how-to-play/wavelength" />
        <ScoreboardDrawer />
        <button
          type="button"
          aria-label="End game"
          onClick={onQuit}
          className="mb-square-btn"
        >
          <X className="size-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

export function WavelengthScreen() {
  const [game, setGame] = usePersisted<Game>("wavelength:game:v2", NEW_GAME);
  const [roster, setRoster] = usePersisted<RosterPlayer[]>(
    "wavelength:roster",
    [],
  );
  const [board, setBoard] = useScoreboard();
  const [peeking, setPeeking] = useState(false);
  const [clue, setClue] = useState("");
  const { phase } = game;

  useWakeLock(phase.kind !== "briefing" && phase.kind !== "players");

  const scoreOf = (id: string) => board.find((p) => p.id === id)?.score ?? 0;
  const seats = seatsFor(game.mode, roster);
  const problem = rosterProblem(game.mode, seats);

  const act = (action: Action) => {
    const next = reduce(game, action);
    if (next.phase.kind === "reveal" && phase.kind !== "reveal") {
      revealHit();
      setBoard(addPoints(board, next.phase.awards));
    } else blip();
    setPeeking(false);
    setGame(next);
  };

  const setup = () => {
    if (roster.length === 0) setRoster(rosterFromScoreboard(board));
    act({ type: "setup" });
  };

  const start = (startSeats: Seat[]) => {
    setBoard(
      startSeats.map((s) => ({
        id: s.id,
        name: s.name,
        score: 0,
        ...(game.mode === "teams" ? { members: s.members } : {}),
      })),
    );
    setClue("");
    act({ type: "start", seats: startSeats, card: deal() });
  };

  const giveClue = () => {
    act({ type: "clue", text: clue });
    setClue("");
  };

  const quit = () => {
    if (
      phase.kind === "over" ||
      window.confirm("End this game? The scoreboard keeps its points.")
    ) {
      act({ type: "reset" });
    }
  };

  const card = "card" in phase ? phase.card : null;
  const palette = card
    ? roundPalette(card.spectrum.id, card.target)
    : paletteById("miami");
  const banner = bannerFor(game);
  const shownClue = "clue" in phase ? phase.clue : "";

  const dial = phase.kind === "guess" ? phase.dial : null;
  const locked =
    phase.kind === "call" || phase.kind === "reveal" ? phase.guesses : [];
  const target =
    phase.kind === "reveal" || (phase.kind === "psychic" && peeking)
      ? (card?.target ?? null)
      : null;

  return (
    <div {...theme(palette)} className="flex h-dvh flex-col">
      <div className="mb-label mb-label-bleed flex-1">
        <PaletteGrain
          palette={palette}
          tone="ink"
          className="absolute inset-0"
        />
        <div
          {...theme(palette, { flipped: true })}
          className="mb-label-field relative flex min-h-0 flex-1 flex-col"
        >
          <h1 className="sr-only">Wavelength</h1>
          {phase.kind === "briefing" ? (
            <WavelengthBriefing
              mode={game.mode}
              rounds={game.rounds}
              onMode={(mode) => act({ type: "mode", mode })}
              onRounds={(rounds) => act({ type: "rounds", rounds })}
            />
          ) : phase.kind === "players" ? (
            <WavelengthPlayers
              mode={game.mode}
              roster={roster}
              problem={problem}
              onRoster={setRoster}
              onBack={() => act({ type: "reset" })}
            />
          ) : (
            <>
              <ScoreStrip game={game} scoreOf={scoreOf} onQuit={quit} />
              {phase.kind === "over" ? (
                <GameOver game={game} scoreOf={scoreOf} />
              ) : card ? (
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto px-4 py-3">
                  {banner ? (
                    <MarqueeBanner
                      key={banner.headline}
                      headline={banner.headline}
                      detail={banner.detail}
                      className="animate-punch"
                    />
                  ) : null}
                  {shownClue ? (
                    <p className="text-center">
                      <span className="mb-caps block text-[0.6rem] opacity-80">
                        The clue
                      </span>
                      <span className="mb-display-sm text-3xl leading-tight break-words">
                        {shownClue}
                      </span>
                    </p>
                  ) : null}
                  <WavelengthDial
                    dial={dial ?? (locked.length === 1 ? locked[0].dial : null)}
                    others={
                      locked.length > 1 ? locked.map((g) => g.dial) : undefined
                    }
                    target={target}
                    label={`${card.spectrum.left} to ${card.spectrum.right}`}
                    palette={palette}
                    onHold={phase.kind === "psychic" ? setPeeking : undefined}
                    onMove={
                      phase.kind === "guess"
                        ? (value) =>
                            setGame(reduce(game, { type: "move", dial: value }))
                        : undefined
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <p className="mb-display-sm text-accent text-2xl leading-tight">
                      <ArrowLeft
                        className="inline size-[1em] align-[-0.125em]"
                        strokeWidth={3}
                        aria-hidden
                      />{" "}
                      {card.spectrum.left}
                    </p>
                    <p className="mb-display-sm text-accent text-right text-2xl leading-tight">
                      {card.spectrum.right}{" "}
                      <ArrowRight
                        className="inline size-[1em] align-[-0.125em]"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </p>
                  </div>
                  {phase.kind === "psychic" ? (
                    <div className="flex flex-col items-center gap-3">
                      <Input
                        value={clue}
                        onChange={(e) => setClue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") giveClue();
                        }}
                        maxLength={CLUE_MAX}
                        enterKeyHint="done"
                        autoComplete="off"
                        placeholder={
                          game.mode === "guesser"
                            ? "Type the clues (optional)"
                            : "Type your clue (optional)"
                        }
                        aria-label="Clue"
                        className="text-center"
                      />
                      <button
                        type="button"
                        onClick={() => act({ type: "skip", card: deal() })}
                        className={LINK}
                      >
                        Skip this card
                      </button>
                    </div>
                  ) : phase.kind === "reveal" ? (
                    <RevealScore game={game} />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="relative flex">
          {phase.kind === "briefing" ? (
            <BandButton onClick={setup}>Add players</BandButton>
          ) : phase.kind === "players" ? (
            <BandButton
              disabled={problem !== null}
              onClick={() => start(seats)}
            >
              Start game
            </BandButton>
          ) : phase.kind === "psychic" ? (
            <BandButton onClick={giveClue}>
              {game.mode === "guesser"
                ? `Hand it to ${roles(game).active.name}`
                : "Let them guess"}
            </BandButton>
          ) : phase.kind === "guess" ? (
            <BandButton onClick={() => act({ type: "lock" })}>
              Lock it in
            </BandButton>
          ) : phase.kind === "call" ? (
            <>
              <BandButton onClick={() => act({ type: "call", side: "left" })}>
                <ArrowLeft
                  className="size-[1em] shrink-0"
                  strokeWidth={3}
                  aria-hidden
                />{" "}
                Left
              </BandButton>
              <BandButton onClick={() => act({ type: "call", side: "right" })}>
                Right{" "}
                <ArrowRight
                  className="size-[1em] shrink-0"
                  strokeWidth={3}
                  aria-hidden
                />
              </BandButton>
            </>
          ) : phase.kind === "reveal" ? (
            <BandButton onClick={() => act({ type: "next", card: deal() })}>
              {isLastTurn(game) ? "Final score" : "Next card"}
            </BandButton>
          ) : (
            <>
              <BandButton
                className="flex-[3]"
                onClick={() => start(game.seats)}
              >
                Play again
              </BandButton>
              <BandButton
                className="flex-[2]"
                onClick={() => act({ type: "reset" })}
              >
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
  const { awards, call } = game.phase;
  const nameOf = (id: string) =>
    game.seats.find((s) => s.id === id)?.name ?? "";

  if (game.mode === "psychic") {
    return (
      <ul className="animate-punch flex flex-wrap justify-center gap-x-4 gap-y-1">
        {awards.map((a) => (
          <li key={a.seat} className="mb-caps text-xs">
            {nameOf(a.seat)}
            {a.role === "psychic" ? " (Psychic)" : ""}{" "}
            <span className="mb-display-sm text-accent text-xl">
              +{a.points}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  const main = awards.find((a) => a.role === "guess");
  const bonus = awards.find((a) => a.role === "call");
  const callLine =
    bonus && call && main && main.points < BULLSEYE
      ? ` · ${nameOf(bonus.seat)} ${bonus.points ? "+1 for the call" : "called it wrong"}`
      : "";
  return (
    <div className="animate-punch text-center">
      <p className="mb-display mb-shadow text-5xl">
        {main?.points ? `+${main.points}` : "Miss"}
      </p>
      <p className="mb-caps text-[0.7rem]">
        {main ? nameOf(main.seat) : ""} scores {main?.points ?? 0}
        {callLine}
      </p>
    </div>
  );
}

function GameOver({
  game,
  scoreOf,
}: {
  game: Game;
  scoreOf: (id: string) => number;
}) {
  const top = leaders(game.seats, scoreOf);
  const ranked = [...game.seats].sort((a, b) => scoreOf(b.id) - scoreOf(a.id));
  const headline =
    top.length === 0
      ? "Static"
      : top.length === 1
        ? `${top[0].name} wins`
        : "It's a tie";
  return (
    <div className="animate-punch flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="mb-display mb-shadow text-6xl leading-none text-balance">
        {headline}
      </h2>
      <ol className="mb-caps space-y-1 text-xs">
        {ranked.map((s) => (
          <li key={s.id}>
            {s.name}{" "}
            <span className="mb-display-sm text-accent text-xl">
              {scoreOf(s.id)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
