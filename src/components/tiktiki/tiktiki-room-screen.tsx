"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BandButton } from "@/components/layout/band-button";
import { MarqueeBanner } from "@/components/layout/marquee-banner";
import { PageCorners } from "@/components/layout/page-corners";
import { SideDrawer } from "@/components/layout/side-drawer";
import { PhaseCurtain } from "@/components/mafia/phase-curtain";
import { RematchCountdown } from "@/components/mafia/rematch-countdown";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { PlayerAvatar } from "@/components/room/player-avatar";
import { RoomLobby } from "@/components/room/room-lobby";
import { TapToast } from "@/components/room/tap-toast";
import { AccuseDrawer } from "@/components/tiktiki/accuse-drawer";
import { HoldToRevealPlace, PlaceCardFace } from "@/components/tiktiki/place-card";
import { PlaceList } from "@/components/tiktiki/place-list";
import { PlacesDrawer } from "@/components/tiktiki/places-drawer";
import { RoundClock } from "@/components/tiktiki/round-clock";
import { TiktikiRules } from "@/components/tiktiki/tiktiki-rules";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import type { Beat } from "@/content/mafia-copy";
import { ASK_RULE, tiktikiBeats } from "@/content/tiktiki-copy";
import type { RoomHandle } from "@/lib/hooks/use-room";
import { useOnline } from "@/lib/hooks/use-online";
import { paletteById, theme } from "@/lib/palettes";
import { dayBreaks, gavel, primeAudio, revealHit } from "@/lib/sound-and-haptics";
import {
  ROUND_MINUTES_OPTIONS,
  placeName,
  thePlace,
  type Done,
  type PlaceId,
  type Result,
  type RoomStateOf,
  type TiktikiAction,
  type TiktikiPublicRound,
} from "@shared/protocol";

const NEON = paletteById("neon");
const LEMON = paletteById("lemon");
const TOAST_MS = 2600;

type TiktikiRoom = RoomStateOf<"tiktiki">;

const CUES: Partial<Record<TiktikiRoom["phase"], () => void>> = {
  questioning: dayBreaks,
  accusation: gavel,
  guess: revealHit,
  over: revealHit,
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const listOf = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? "Nobody") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

const townWon = (round: TiktikiPublicRound) => round.outcome === "caught" && round.guessId !== round.placeId;

function beatFor(phase: TiktikiRoom["phase"], round: TiktikiPublicRound, seed: string, nameOf: (id: string) => string): Beat | null {
  const trial = round.trial;
  const tiktiki = round.tiktikiId ? nameOf(round.tiktikiId) : "";
  switch (phase) {
    case "questioning":
      return trial?.convicted === false
        ? tiktikiBeats.acquitted(
          seed,
          nameOf(trial.accusedId),
          listOf((trial.ballots ?? []).filter((b) => !b.guilty).map((b) => nameOf(b.voterId))),
        )
        : tiktikiBeats.deal(seed, nameOf(round.firstAskerId));
    case "accusation":
      return trial ? tiktikiBeats.trial(seed, nameOf(trial.accuserId), nameOf(trial.accusedId)) : null;
    case "guess":
      return round.ending
        ? tiktikiBeats.unmasked(seed, round.ending, tiktiki, trial ? nameOf(trial.accusedId) : "")
        : null;
    case "over":
      if (round.outcome === "aborted" || !round.placeId) return tiktikiBeats.over(seed, "aborted", {});
      return tiktikiBeats.over(seed, townWon(round) ? "town" : "escaped", {
        tiktiki,
        place: thePlace(round.placeId),
        guess: round.guessId ? thePlace(round.guessId) : "nothing at all",
      });
    default:
      return null;
  }
}

/**
 * The Tiktiki play surface. During questioning it is a clock, the turn sign and one hold-to-peek
 * card, the same on every phone; the places are a drawer away. A trial freezes the clock and asks
 * everyone else for a verdict, and every round ends on the Tiktiki's guess.
 */
export function TiktikiRoomScreen({
  state,
  room,
  reconnecting,
}: {
  state: TiktikiRoom;
  room: RoomHandle<"tiktiki">;
  reconnecting: boolean;
}) {
  const round = state.round;
  const your = state.your;
  const phase = state.phase;
  const stage = `${state.code}:${round?.roundNo ?? 0}:${phase}:${round?.accusers.length ?? 0}`;

  const [toast, setToast] = useState<string | null>(null);
  const [guess, setGuess] = useState<{ stage: string; id: PlaceId } | null>(null);
  const [seenStage, setSeenStage] = useState(stage);
  const [curtain, setCurtain] = useState<string | null>(null);
  const heard = useRef(stage);
  const online = useOnline();
  const cutOff = !online || reconnecting;

  if (stage !== seenStage) {
    setSeenStage(stage);
    setCurtain(round ? stage : null);
  }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (heard.current === stage) return;
    heard.current = stage;
    CUES[phase]?.();
  }, [stage, phase]);

  const lift = useCallback(() => setCurtain(null), []);

  const isHost = state.hostId === state.you;
  const lobby = !round;
  const palette = phase === "over" && round && townWon(round) ? LEMON : NEON;
  const nameOf = (id: string) =>
    round?.roster.find((p) => p.id === id)?.name ?? state.players.find((p) => p.id === id)?.name ?? "Someone";
  const beat = round ? beatFor(phase, round, stage, nameOf) : null;
  const chosenPlace = guess?.stage === stage ? guess.id : null;
  const trial = round?.trial ?? null;
  const live = round !== null && phase !== "over";
  const short = state.players.length < state.minPlayers;
  const host = nameOf(state.hostId);
  const playing = Boolean(your) && Boolean(round?.roster.find((p) => p.id === state.you)?.present);

  const send = async (action: TiktikiAction, done: string) => {
    primeAudio();
    const r = await room.act(action);
    setToast(r.ok ? done : r.error.message);
  };
  const hostDo = async (fn: () => Promise<Result<Done>>, done: string) => {
    const r = await fn();
    setToast(r.ok ? done : r.error.message);
  };

  const votesIn = trial ? `${trial.votedBy.length} of ${trial.total} votes in` : "";

  function band() {
    if (cutOff) {
      return (
        <div className="mb-band relative flex-col px-4 py-3 text-center">
          <p className="mb-display-sm text-base">{online ? "Reconnecting…" : "No signal"}</p>
          <p className="mb-caps text-[0.55rem] opacity-70">Your seat and your secret are safe. Hang tight.</p>
        </div>
      );
    }
    if (lobby || phase === "over") {
      return isHost ? (
        <BandButton
          onClick={() => {
            primeAudio();
            void room.start();
          }}
          disabled={short}
          detail={short ? `Round up ${plural(state.minPlayers - state.players.length, "more player", "more players")}` : undefined}
        >
          {lobby ? "Deal the cards" : "Run it back"}
        </BandButton>
      ) : (
        <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">
          {lobby ? `Waiting for ${host} to deal…` : `Waiting for ${host} to run it back…`}
        </p>
      );
    }
    if (!your || !playing || !round) {
      return (
        <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">Pull up a chair. You&apos;re in next round.</p>
      );
    }
    switch (phase) {
      case "questioning":
        return (
          <AccuseDrawer
            key={stage}
            suspects={round.roster
              .filter((p) => p.present && p.id !== state.you)
              .map((p) => ({
                id: p.id,
                name: p.name,
                away: !state.players.find((s) => s.id === p.id)?.connected,
              }))}
            palette={palette}
            used={round.accusers.includes(state.you)}
            onAccuse={(id) => void send({ type: "accuse", targetId: id }, "Order in the court")}
          />
        );
      case "accusation":
        if (trial?.accusedId === state.you) {
          return <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">They&apos;re onto you. Look innocent.</p>;
        }
        if (your.verdict !== null) {
          return <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">Vote&apos;s in · {votesIn}</p>;
        }
        return (
          <>
            <BandButton onClick={() => void send({ type: "verdict", guilty: true }, "Guilty, says you")} detail="Lock 'em up">
              Guilty
            </BandButton>
            <BandButton onClick={() => void send({ type: "verdict", guilty: false }, "Innocent, says you")} detail="Let 'em go">
              Innocent
            </BandButton>
          </>
        );
      case "guess":
        return your.tiktiki ? (
          <BandButton
            onClick={() => chosenPlace && void send({ type: "guess", placeId: chosenPlace }, "Called it")}
            disabled={!chosenPlace}
            detail={chosenPlace ? `Final answer: ${placeName(chosenPlace)}` : "Tap a place first"}
          >
            Call it
          </BandButton>
        ) : (
          <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">The Tiktiki is thinking…</p>
        );
      default:
        return null;
    }
  }

  function field() {
    if (!round) {
      return (
        <RoomLobby code={state.code} players={state.players} minPlayers={state.minPlayers} maxPlayers={state.maxPlayers}>
          {isHost ? (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="mb-caps text-sm opacity-70">Clock</span>
              {ROUND_MINUTES_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  active={state.settings.roundMinutes === m}
                  onClick={() => void room.configure({ roundMinutes: m })}
                >
                  {m} min
                </Chip>
              ))}
            </div>
          ) : (
            <p className="mb-caps text-sm">{state.settings.roundMinutes}-minute rounds</p>
          )}
        </RoomLobby>
      );
    }
    const face = your ? (your.tiktiki ? null : your.placeId) : undefined;
    const card = face !== undefined && playing ? <HoldToRevealPlace face={face} palette={palette} /> : null;

    switch (phase) {
      case "questioning":
        return (
          <div className="mx-auto my-auto flex w-full max-w-md flex-col items-center gap-7">
            <RoundClock deadlineAt={round.deadlineAt} msLeft={round.msLeft} roundMs={round.roundMs} />
            <MarqueeBanner
              headline={`${nameOf(round.firstAskerId)} asks first`}
              detail={ASK_RULE}
              className="w-full"
            />
            {card}
          </div>
        );
      case "accusation": {
        const accused = round.roster.find((p) => p.id === trial?.accusedId);
        return (
          <div className="mx-auto my-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
            <RoundClock deadlineAt={null} msLeft={round.msLeft} roundMs={round.roundMs} />
            {accused ? (
              <div className="flex flex-col items-center gap-2">
                <span className="size-24 overflow-hidden border-[length:var(--rule-thin)] border-[color:var(--cw-secondary)] bg-[var(--loud)] shadow-[5px_5px_0_var(--shadow-ink)]">
                  <PlayerAvatar seed={accused.name} palette={palette} className="size-full scale-125" />
                </span>
                <span className="mb-caps text-sm">{accused.id === state.you ? "You're on trial" : "On trial"}</span>
              </div>
            ) : null}
            <header className="space-y-1.5">
              <h2 className="mb-display mb-shadow text-4xl leading-none">{beat?.title}</h2>
              <p className="text-sm font-semibold opacity-85">{votesIn}. One no and they walk.</p>
            </header>
            {card}
          </div>
        );
      }
      case "guess":
        return your?.tiktiki ? (
          <div className="mx-auto w-full max-w-md space-y-4">
            <header className="space-y-1.5 text-center">
              <h2 className="mb-display mb-shadow text-4xl leading-none">Name the place</h2>
              <p className="text-sm font-semibold opacity-85">One guess. Get it right for two more points.</p>
            </header>
            <PlaceList places={round.suspects} selected={chosenPlace} onTap={(id) => setGuess({ stage, id })} />
          </div>
        ) : (
          <div className="mx-auto my-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
            <header className="space-y-1.5">
              <h2 className="mb-display mb-shadow text-4xl leading-none">{beat?.title}</h2>
              <p className="text-sm font-semibold opacity-85">{beat?.line}</p>
            </header>
            {card}
          </div>
        );
      case "over": {
        const slips: SeatSlip[] = round.roster.map((p) => {
          const seat = state.players.find((s) => s.id === p.id);
          const got = round.points?.[p.id] ?? 0;
          return {
            id: p.id,
            name: p.name,
            you: p.id === state.you,
            away: !p.present,
            note: `${p.id === round.tiktikiId ? "Tiktiki · " : ""}${plural(seat?.score ?? 0, "pt", "pts")}`,
            badge: got ? `+${got}` : null,
            selected: p.id === round.tiktikiId,
          };
        });
        return (
          <div className="mx-auto w-full max-w-md space-y-5">
            <header className="space-y-1.5 text-center">
              <h2 className="mb-display mb-shadow text-4xl leading-none">{beat?.title}</h2>
              <p className="text-sm font-semibold opacity-85">{beat?.line}</p>
            </header>
            {round.placeId && round.outcome !== "aborted" ? (
              <PlaceCardFace face={round.placeId} palette={palette} className="mx-auto w-44 -rotate-[0.4deg]" />
            ) : null}
            <SeatBoard slips={slips} palette={palette} />
          </div>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div {...theme(palette)} className="flex h-dvh flex-col">
      <TapToast message={toast} />
      <RematchCountdown key={state.startsAt ?? "idle"} startsAt={state.startsAt} palette={NEON} />
      <PhaseCurtain beat={beat && curtain === stage ? { ...beat, id: stage } : null} palette={palette} onDone={lift} />
      <div className="mb-label mb-label-bleed min-h-0 flex-1">
        <PaletteGrain palette={palette} tone="ink" className="absolute inset-0" />
        <div {...theme(palette, { flipped: true })} className="mb-label-field relative flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">Tiktiki</h1>
          <PageCorners
            room={state.players}
            extra={
              <>
                <SideDrawer label="How to play" icon="?" title="How to play" className="mb-square-btn mb-display-sm text-2xl">
                  <TiktikiRules />
                </SideDrawer>
                {live && round ? <PlacesDrawer key={round.roundNo} places={round.suspects} /> : null}
                <SideDrawer
                  label="Room"
                  icon={<Settings className="size-5" strokeWidth={2.5} aria-hidden />}
                  title={`Room ${state.code}`}
                  className="mb-square-btn"
                >
                  {isHost && phase === "accusation" ? (
                    <div className="space-y-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => hostDo(() => room.act({ type: "verdict:close" }), "Gavel's down")}
                      >
                        Bang the gavel
                      </Button>
                      <p className="text-sm opacity-70">Someone&apos;s phone dozed off? Anyone who hasn&apos;t voted counts as not guilty.</p>
                    </div>
                  ) : null}
                  {isHost && live ? (
                    <div className="space-y-1.5">
                      <Button variant="secondary" size="sm" onClick={() => hostDo(room.abort, "Round called off")}>
                        Call it off
                      </Button>
                      <p className="text-sm opacity-70">Ends this round. Nobody scores, nobody heard anything.</p>
                    </div>
                  ) : null}
                  {isHost && state.players.length > 1 ? (
                    <div className="space-y-2">
                      <p className="mb-caps text-sm opacity-60">Show someone the door</p>
                      <div className="flex flex-wrap gap-2">
                        {state.players
                          .filter((p) => p.id !== state.you)
                          .map((p) => (
                            <Button
                              key={p.id}
                              variant="tertiary"
                              size="sm"
                              onClick={() => hostDo(() => room.kick(p.id), `${p.name} has left the building`)}
                            >
                              {p.name}
                            </Button>
                          ))}
                      </div>
                      <p className="text-sm opacity-70">For someone who has actually gone home. The round carries on without them.</p>
                    </div>
                  ) : null}
                  <Button variant="tertiary" size="sm" onClick={room.leave}>
                    Leave the room
                  </Button>
                </SideDrawer>
              </>
            }
          />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-16 pb-8 sm:px-8">{field()}</div>
        </div>
        <div className="relative flex">{band()}</div>
      </div>
    </div>
  );
}
