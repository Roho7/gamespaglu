"use client";

import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BandButton } from "@/components/layout/band-button";
import { PageCorners } from "@/components/layout/page-corners";
import { SideDrawer } from "@/components/layout/side-drawer";
import { GameReplay } from "@/components/mafia/game-replay";
import { FATE_LABEL, MafiaRules, ROLE_LABEL, mixLine } from "@/components/mafia/mafia-rules";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { YourCard } from "@/components/mafia/your-card";
import { RoomLobby } from "@/components/room/room-lobby";
import { TapToast } from "@/components/room/tap-toast";
import { Button } from "@/components/ui/button";
import type { RoomHandle } from "@/lib/hooks/use-room";
import { useOnline } from "@/lib/hooks/use-online";
import { paletteById, theme } from "@/lib/palettes";
import { dayBreaks, nightFalls, primeAudio, revealHit } from "@/lib/sound-and-haptics";
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
  verdict: revealHit,
  over: revealHit,
};

function headline(state: MafiaRoom, round: MafiaPublicRound, nameOf: (id: string) => string) {
  const roleOf = (id: string) => {
    const role = round.roster.find((p) => p.id === id)?.role;
    return role ? ROLE_LABEL[role] : "";
  };
  const alive = state.your?.alive ?? false;
  switch (state.phase) {
    case "night":
      return { small: `Night ${round.night}`, big: alive ? "Night falls. Choose a player." : "Night falls", sub: "" };
    case "day": {
      const died = round.news?.died ?? null;
      return {
        small: `Day ${round.night}`,
        big: died ? `${nameOf(died)} was killed` : "Nobody died",
        sub: died ? roleOf(died) : "The Doctor got there first, or the Mafia never agreed",
      };
    }
    case "vote":
      return { small: `Day ${round.night}`, big: "Who goes out?", sub: "" };
    case "verdict": {
      const out = round.vote?.result?.out ?? null;
      return {
        small: `Day ${round.night}`,
        big: out ? `${nameOf(out)} is out` : "Nobody goes out",
        sub: out ? roleOf(out) : "",
      };
    }
    case "over":
      return {
        small: "Game over",
        big:
          round.outcome === "town"
            ? "The town wins"
            : round.outcome === "mafia"
              ? "The Mafia win"
              : "Game abandoned",
        sub: "",
      };
    default:
      return { small: "", big: "", sub: "" };
  }
}

/**
 * The Mafia play surface. Every living player's screen says the same words and offers the same
 * seats at night; what a pick means lives only on the hold-to-reveal card. The palette turns cobalt
 * at night and cherry by day, on every phone at once, with the same tone and buzz.
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
  const stage = `${round?.roundNo ?? 0}:${round?.night ?? 0}:${phase}`;

  const [toast, setToast] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ stage: string; id: string } | null>(null);
  const heard = useRef(stage);
  const online = useOnline();
  const cutOff = !online || reconnecting;

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

  const isHost = state.hostId === state.you;
  const alive = your?.alive ?? false;
  const lobby = !round;
  const palette = phase === "night" ? NIGHT : DAY;
  const chosen = choice?.stage === stage ? choice.id : null;
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
    const tally = phase === "over" && seat ? ` · ${seat.score} ${seat.score === 1 ? "pt" : "pts"}` : "";
    return {
      id: p.id,
      name: p.name,
      you: p.id === state.you,
      away: seat ? !seat.connected : false,
      out: !p.alive,
      note: p.role
        ? `${p.fate ? `${FATE_LABEL[p.fate]} · ` : ""}${ROLE_LABEL[p.role]}${tally}`
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

  const { small, big, sub } = round
    ? headline(state, round, nameOf)
    : { small: "", big: "", sub: "" };
  const waiting = round?.waitingOn ?? 0;
  const live = round !== null && phase !== "over";
  const short = state.players.length < state.minPlayers;

  function band() {
    if (cutOff) {
      return (
        <div className="mb-band relative flex-col px-4 py-3 text-center">
          <p className="mb-display-sm text-base">{online ? "Reconnecting…" : "No signal"}</p>
          <p className="mb-caps text-[0.55rem] opacity-70">Your seat and your role are held. Nothing is lost.</p>
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
          detail={short ? `Need ${state.minPlayers} players` : undefined}
        >
          {lobby ? "Start" : "Deal again"}
        </BandButton>
      ) : (
        <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">
          Waiting for {nameOf(state.hostId)}…
        </p>
      );
    }
    if (!your || !alive) {
      return (
        <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">
          {your ? "You're out. Watch quietly." : "You're watching. You join the next deal."}
        </p>
      );
    }
    switch (phase) {
      case "night":
        return (
          <BandButton
            onClick={() => chosen && void send({ type: "night:pick", targetId: chosen }, "Locked in")}
            disabled={!chosen || chosen === your.pick}
            detail={`${your.pick ? "Locked · " : ""}Waiting on ${waiting}`}
          >
            Lock in
          </BandButton>
        );
      case "day":
        return <BandButton onClick={() => void send({ type: "vote:call" }, "Vote called")}>Call the vote</BandButton>;
      case "vote":
        return your.vote ? (
          <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">
            Voted · {round.vote?.votesIn ?? 0} of {round.vote?.total ?? 0} in
          </p>
        ) : (
          <BandButton
            onClick={() => chosen && void send({ type: "vote:cast", targetId: chosen }, "Vote in")}
            disabled={!chosen}
            detail={`${round.vote?.votesIn ?? 0} of ${round.vote?.total ?? 0} in`}
          >
            Vote
          </BandButton>
        );
      case "verdict":
        return <BandButton onClick={() => void send({ type: "night:fall" }, "Night falls")}>Night falls</BandButton>;
      default:
        return null;
    }
  }

  return (
    <div {...theme(palette)} className="flex h-dvh flex-col">
      <TapToast message={toast} />
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
                        onClick={() => hostDo(() => room.act({ type: "night:end" }), "Night ended")}
                      >
                        End the night
                      </Button>
                      <p className="text-[0.7rem] opacity-70">
                        For a phone locked in a pocket. Picks not made count as nothing.
                      </p>
                    </div>
                  ) : null}
                  {isHost && phase === "vote" ? (
                    <div className="space-y-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => hostDo(() => room.act({ type: "vote:close" }), "Vote closed")}
                      >
                        Close the vote
                      </Button>
                      <p className="text-[0.7rem] opacity-70">Ballots not cast do not count.</p>
                    </div>
                  ) : null}
                  {isHost && live ? (
                    <div className="space-y-1.5">
                      <Button variant="secondary" size="sm" onClick={() => hostDo(room.abort, "Game ended")}>
                        End this game
                      </Button>
                      <p className="text-[0.7rem] opacity-70">Nobody scores. Deal again from the lobby.</p>
                    </div>
                  ) : null}
                  {isHost && state.players.length > 1 ? (
                    <div className="space-y-2">
                      <p className="mb-caps text-[0.6rem] opacity-60">Remove a player</p>
                      <div className="flex flex-wrap gap-2">
                        {state.players
                          .filter((p) => p.id !== state.you)
                          .map((p) => (
                            <Button
                              key={p.id}
                              variant="tertiary"
                              size="sm"
                              onClick={() => hostDo(() => room.kick(p.id), `${p.name} removed`)}
                            >
                              {p.name}
                            </Button>
                          ))}
                      </div>
                      <p className="text-[0.7rem] opacity-70">
                        For someone who has gone home. Mid-game they are out, and their role is shown.
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

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-16 pb-3 sm:px-8">
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
              <div className="mx-auto my-auto w-full max-w-md space-y-4">
                <header className="space-y-0.5 text-center">
                  <p className="mb-caps text-[0.55rem] opacity-60">
                    {small}
                    {reconnecting ? " · reconnecting" : ""}
                  </p>
                  <h2 className="mb-display-sm text-3xl">{big}</h2>
                  {sub ? <p className="mb-caps text-[0.6rem] opacity-80">{sub}</p> : null}
                </header>

                <SeatBoard
                  slips={slips}
                  onSelect={(id) => setChoice({ stage, id })}
                />

                {your ? <YourCard your={your} nameOf={nameOf} /> : null}

                {phase === "over" && round.replay?.length ? (
                  <section className="space-y-2 border-t-[length:var(--rule-thin)] border-current pt-3">
                    <h3 className="mb-display-sm text-xl">What happened</h3>
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
