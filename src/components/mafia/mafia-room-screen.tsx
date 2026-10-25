"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BandButton } from "@/components/layout/band-button";
import { PageCorners } from "@/components/layout/page-corners";
import { SideDrawer } from "@/components/layout/side-drawer";
import { GameReplay } from "@/components/mafia/game-replay";
import { FATE_LABEL, MafiaRules, ROLE_LABEL, mixLine } from "@/components/mafia/mafia-rules";
import { PhaseCurtain } from "@/components/mafia/phase-curtain";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { YourCard } from "@/components/mafia/your-card";
import { RoomLobby } from "@/components/room/room-lobby";
import { TapToast } from "@/components/room/tap-toast";
import { Button } from "@/components/ui/button";
import { mafiaBeats, type Beat } from "@/content/mafia-copy";
import type { RoomHandle } from "@/lib/hooks/use-room";
import { useOnline } from "@/lib/hooks/use-online";
import { paletteById, theme } from "@/lib/palettes";
import { dayBreaks, gavel, nightFalls, primeAudio, revealHit } from "@/lib/sound-and-haptics";
import {
  NO_ONE,
  sideOf,
  type Done,
  type MafiaAction,
  type MafiaPublicRound,
  type Result,
  type RoomStateOf,
} from "@shared/protocol";

const DAY = paletteById("cherry");
const NIGHT = paletteById("cobalt");
const TOAST_MS = 2600;

type MafiaRoom = RoomStateOf<"mafia">;

const CUES: Partial<Record<MafiaRoom["phase"], () => void>> = {
  night: nightFalls,
  day: dayBreaks,
  vote: gavel,
  verdict: revealHit,
  over: revealHit,
};

function beatFor(phase: MafiaRoom["phase"], round: MafiaPublicRound, seed: string): Beat | null {
  const fallen = (id: string | null) => {
    const p = round.roster.find((r) => r.id === id);
    return p?.role ? { name: p.name, role: p.role } : null;
  };
  switch (phase) {
    case "night":
      return mafiaBeats.night(seed);
    case "day":
      return mafiaBeats.morning(seed, fallen(round.news?.died ?? null));
    case "vote":
      return mafiaBeats.vote(seed);
    case "verdict":
      return mafiaBeats.verdict(seed, fallen(round.vote?.result?.out ?? null));
    case "over":
      return mafiaBeats.over(seed, round.outcome ?? "aborted");
    default:
      return null;
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * The Mafia play surface. Every living player's screen says the same words and offers the same
 * seats at night; what a pick means lives only on the hold-to-reveal card. Each new beat raises a
 * curtain on every phone at once, with the same line, sound and buzz, and the palette turns cobalt
 * at night and cherry by day.
 */
export function MafiaRoomScreen({
  state,
  room,
  reconnecting,
}: {
  state: MafiaRoom;
  room: RoomHandle<"mafia">;
  reconnecting: boolean;
}) {
  const round = state.round;
  const your = state.your;
  const phase = state.phase;
  const stage = `${state.code}:${round?.roundNo ?? 0}:${round?.night ?? 0}:${phase}`;

  const [toast, setToast] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ stage: string; id: string } | null>(null);
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
  const alive = your?.alive ?? false;
  const lobby = !round;
  const palette = phase === "night" ? NIGHT : DAY;
  const chosen = choice?.stage === stage ? choice.id : null;
  const beat = round ? beatFor(phase, round, stage) : null;
  const nameOf = (id: string) =>
    round?.roster.find((p) => p.id === id)?.name ??
    state.players.find((p) => p.id === id)?.name ??
    "Someone";

  const send = async (action: MafiaAction, done: string) => {
    primeAudio();
    const r = await room.act(action);
    setToast(r.ok ? done : r.error.message);
  };
  const hostDo = async (fn: () => Promise<Result<Done>>, done: string) => {
    const r = await fn();
    setToast(r.ok ? done : r.error.message);
  };

  const canPick = phase === "night" && alive;
  const canVote = phase === "vote" && alive && !your?.vote;
  const ballots = phase === "verdict" ? (round?.vote?.result?.ballots ?? []) : [];
  const countFor = (id: string) => ballots.filter((b) => b.targetId === id).length;
  const current = canPick ? (chosen ?? your?.pick ?? null) : phase === "vote" ? (chosen ?? your?.vote ?? null) : null;

  const slips: SeatSlip[] = (round?.roster ?? []).map((p) => {
    const seat = state.players.find((s) => s.id === p.id);
    const won = phase === "over" && p.role && round?.outcome === sideOf(p.role);
    const tally = phase === "over" && seat ? ` · ${plural(seat.score, "pt", "pts")}` : "";
    return {
      id: p.id,
      name: p.name,
      you: p.id === state.you,
      away: seat ? !seat.connected : false,
      out: !p.alive,
      stamp: p.fate ? FATE_LABEL[p.fate] : undefined,
      note: p.role
        ? `${ROLE_LABEL[p.role]}${tally}`
        : phase === "vote" && round?.vote?.votedBy.includes(p.id)
          ? "voted"
          : undefined,
      badge: phase === "over" ? (won ? "+1" : null) : countFor(p.id) ? String(countFor(p.id)) : null,
      selected: current === p.id,
      open: p.alive && (canPick || (canVote && p.id !== state.you)),
    };
  });
  if (phase === "vote" || countFor(NO_ONE)) {
    slips.push({
      id: NO_ONE,
      name: "No one",
      abstain: true,
      badge: countFor(NO_ONE) ? String(countFor(NO_ONE)) : null,
      selected: current === NO_ONE,
      open: canVote,
    });
  }

  const when =
    phase === "night" ? `Night ${round?.night}` : phase === "over" ? "Game over" : `Day ${round?.night}`;
  const waiting = round?.waitingOn ?? 0;
  const ballotsIn = `${round?.vote?.votesIn ?? 0} of ${round?.vote?.total ?? 0} ballots in`;
  const live = round !== null && phase !== "over";
  const short = state.players.length < state.minPlayers;
  const host = nameOf(state.hostId);

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
          detail={short ? `Round up ${plural(state.minPlayers - state.players.length, "more suspect", "more suspects")}` : undefined}
        >
          {lobby ? "Deal the roles" : "Run it back"}
        </BandButton>
      ) : (
        <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">
          {lobby ? `Waiting for ${host} to deal…` : `Waiting for ${host} to run it back…`}
        </p>
      );
    }
    if (!your || !alive) {
      return (
        <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">
          {your ? "You're out. Ghosts don't talk." : "Pull up a chair. You're in next game."}
        </p>
      );
    }
    switch (phase) {
      case "night":
        return (
          <BandButton
            onClick={() => chosen && void send({ type: "night:pick", targetId: chosen }, "Locked. Act natural.")}
            disabled={!chosen || chosen === your.pick}
            detail={`${your.pick ? "Locked · " : ""}Waiting on ${plural(waiting, "slowpoke", "slowpokes")}`}
          >
            Lock it in
          </BandButton>
        );
      case "day":
        return (
          <BandButton onClick={() => void send({ type: "vote:call" }, "Order in the court")}>
            Put it to a vote
          </BandButton>
        );
      case "vote":
        return your.vote ? (
          <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">Ballot&apos;s in · {ballotsIn}</p>
        ) : (
          <BandButton
            onClick={() => chosen && void send({ type: "vote:cast", targetId: chosen }, "Ballot's in")}
            disabled={!chosen}
            detail={ballotsIn}
          >
            Cast it
          </BandButton>
        );
      case "verdict":
        return (
          <BandButton onClick={() => void send({ type: "night:fall" }, "Lights out")}>Bring on the night</BandButton>
        );
      default:
        return null;
    }
  }

  return (
    <div {...theme(palette)} className="flex h-dvh flex-col">
      <TapToast message={toast} />
      <PhaseCurtain
        beat={beat && curtain === stage ? { ...beat, id: stage } : null}
        palette={palette}
        onDone={lift}
      />
      <div className="mb-label mb-label-bleed min-h-0 flex-1">
        <PaletteGrain palette={palette} tone="ink" className="absolute inset-0" />
        <div
          {...theme(palette, { flipped: true })}
          className="mb-label-field relative flex min-h-0 flex-1 flex-col"
        >
          <h1 className="sr-only">Mafia</h1>
          <PageCorners
            extra={
              <>
                <SideDrawer
                  label="How to play"
                  icon="?"
                  title="How to play"
                  className="mb-square-btn mb-display-sm text-2xl"
                >
                  <MafiaRules />
                </SideDrawer>
                <SideDrawer
                  label="Room"
                  icon={<Settings className="size-5" strokeWidth={2.5} aria-hidden />}
                  title={`Room ${state.code}`}
                  className="mb-square-btn"
                >
                  {isHost && phase === "night" ? (
                    <div className="space-y-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => hostDo(() => room.act({ type: "night:end" }), "Rise and shine")}
                      >
                        Wake the town
                      </Button>
                      <p className="text-[0.7rem] opacity-70">
                        Someone&apos;s phone fell asleep in their pocket? Morning comes without them. Picks
                        not made count for nothing.
                      </p>
                    </div>
                  ) : null}
                  {isHost && phase === "vote" ? (
                    <div className="space-y-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => hostDo(() => room.act({ type: "vote:close" }), "Polls are closed")}
                      >
                        Close the polls
                      </Button>
                      <p className="text-[0.7rem] opacity-70">Anyone still dithering forfeits their ballot.</p>
                    </div>
                  ) : null}
                  {isHost && live ? (
                    <div className="space-y-1.5">
                      <Button variant="secondary" size="sm" onClick={() => hostDo(room.abort, "Game called off")}>
                        Call it off
                      </Button>
                      <p className="text-[0.7rem] opacity-70">Ends this game. Nobody scores, nobody saw anything.</p>
                    </div>
                  ) : null}
                  {isHost && state.players.length > 1 ? (
                    <div className="space-y-2">
                      <p className="mb-caps text-[0.6rem] opacity-60">Show someone the door</p>
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
                      <p className="text-[0.7rem] opacity-70">
                        For someone who has actually gone home. Mid-game they&apos;re out, and everyone sees
                        what they were.
                      </p>
                    </div>
                  ) : null}
                  <Button variant="tertiary" size="sm" onClick={room.leave}>
                    Leave the room
                  </Button>
                </SideDrawer>
              </>
            }
          />

          {your && !lobby ? (
            <YourCard
              your={your}
              nameOf={nameOf}
              palette={palette}
              night={phase === "night"}
              className="absolute right-0 bottom-6 z-20"
            />
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-16 pb-44 sm:px-8">
            {lobby ? (
              <RoomLobby
                code={state.code}
                players={state.players}
                minPlayers={state.minPlayers}
                maxPlayers={state.maxPlayers}
              >
                {short ? null : <p className="mb-caps text-[0.6rem]">{mixLine(state.players.length)}</p>}
              </RoomLobby>
            ) : (
              <div className="mx-auto my-auto w-full max-w-md space-y-5">
                <header className="space-y-1.5 text-center">
                  <p className="mb-caps text-[0.55rem] opacity-60">
                    {when}
                    {reconnecting ? " · reconnecting" : ""}
                  </p>
                  <h2 className="mb-display mb-shadow text-4xl leading-none">{beat?.title}</h2>
                  <p className="text-sm font-semibold opacity-85">{beat?.line}</p>
                </header>

                <SeatBoard slips={slips} palette={palette} onSelect={(id) => setChoice({ stage, id })} />

                {phase === "over" && round.replay?.length ? (
                  <section className="space-y-2 border-t-[length:var(--rule-thin)] border-current pt-3">
                    <h3 className="mb-display-sm text-xl">The whole sordid story</h3>
                    <GameReplay records={round.replay} nameOf={nameOf} />
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="relative flex">{band()}</div>
      </div>
    </div>
  );
}
