"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { BandButton } from "@/components/layout/band-button";
import { PageCorners } from "@/components/layout/page-corners";
import { SideDrawer } from "@/components/layout/side-drawer";
import { PhaseCurtain } from "@/components/mafia/phase-curtain";
import { RematchCountdown } from "@/components/mafia/rematch-countdown";
import { SeatBoard, type SeatSlip } from "@/components/mafia/seat-board";
import { RoomLobby } from "@/components/room/room-lobby";
import { TapToast } from "@/components/room/tap-toast";
import { PolicyBoard } from "@/components/secret-hitler/policy-board";
import { RoleCard } from "@/components/secret-hitler/role-card";
import { SecretHitlerRules, shMixLine } from "@/components/secret-hitler/secret-hitler-rules";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { Button } from "@/components/ui/button";
import {
  POLICY_LABEL,
  POWER_LABEL,
  ROLE_LABEL,
  dealtBeat,
  enactedBeat,
  outcomeBeat,
  voteBeat,
  type Beat,
} from "@/content/secret-hitler-copy";
import type { RoomHandle } from "@/lib/hooks/use-room";
import { useOnline } from "@/lib/hooks/use-online";
import { paletteById, theme } from "@/lib/palettes";
import { gavel, primeAudio, revealHit } from "@/lib/sound-and-haptics";
import { cn } from "@/lib/utils";
import {
  partyOf,
  type Done,
  type Policy,
  type Result,
  type RoomStateOf,
  type ShAction,
  type ShPublicPlayer,
  type ShPublicRound,
} from "@shared/protocol";

const PAGE = paletteById("ballot");
const TOAST_MS = 2600;

type ShRoom = RoomStateOf<"secret-hitler">;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function newsBeat(round: ShPublicRound, seed: string, nameOf: (id: string) => string): Beat | null {
  const news = round.news;
  if (round.outcome) {
    const hitler = round.roster.find((p) => p.role === "hitler");
    return outcomeBeat(round.outcome, hitler?.name ?? "Hitler");
  }
  switch (news.kind) {
    case "dealt":
      return dealtBeat(seed);
    case "vote": {
      const v = round.lastVote;
      return v ? voteBeat(seed, news.passed, nameOf(v.president), nameOf(v.chancellor)) : null;
    }
    case "enacted":
      return enactedBeat(seed, news.policy, news.chaos);
    case "vetoed":
      return news.chaos
        ? enactedBeat(seed, news.chaos, true)
        : { title: "Vetoed", line: "Both policies binned. The election tracker ticks up." };
    case "veto-refused":
      return { title: "Veto refused", line: "The President said no. The Chancellor has to enact one." };
    case "executed":
      return { title: `${nameOf(news.targetId)} is executed`, line: "They weren't Hitler. That's all anyone gets to know." };
    case "special-election":
      return { title: "Special election", line: `${nameOf(news.targetId)} runs for President next.` };
    case "investigated":
      return { title: "Investigated", line: `The President has seen ${nameOf(news.targetId)}'s party card.` };
    case "peeked":
      return { title: "Peeked", line: "The President has seen the top three policies." };
  }
}

function PolicyTile({
  policy,
  selected,
  onSelect,
}: {
  policy: Policy;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const Tile = onSelect ? "button" : "div";
  return (
    <Tile
      {...(onSelect ? { type: "button" as const, onClick: onSelect, "aria-pressed": Boolean(selected) } : {})}
      {...theme(policy === "liberal" ? "cobalt" : "cherry")}
      className={cn(
        "flex aspect-[3/4] min-h-28 flex-1 flex-col items-center justify-center gap-1 border-[length:var(--rule-thin)] border-[var(--cw-shadow)] bg-[var(--cw-base)] p-2 text-[var(--cw-shadow)] shadow-[4px_4px_0_var(--shadow-ink)] transition-transform",
        onSelect && "active:translate-[3px]",
        selected && "-translate-y-2 shadow-[5px_9px_0_var(--shadow-ink)] outline-[length:var(--rule)] outline-[var(--cw-shadow)]",
      )}
    >
      <span className="mb-caps text-[0.6rem] opacity-80">Policy</span>
      <span className="mb-display-sm text-[clamp(1.4rem,6vw,2rem)] leading-none">{POLICY_LABEL[policy]}</span>
    </Tile>
  );
}

export function SecretHitlerRoomScreen({
  state,
  room,
  reconnecting,
}: {
  state: ShRoom;
  room: RoomHandle<"secret-hitler">;
  reconnecting: boolean;
}) {
  const round = state.round;
  const your = state.your;
  const phase = state.phase;
  const online = useOnline();
  const cutOff = !online || reconnecting;
  const stage = `${state.code}:${round?.roundNo ?? 0}:${phase}:${round?.president ?? ""}:${round?.chancellor ?? ""}`;
  const newsKey = round
    ? `${state.code}:${round.roundNo}:${JSON.stringify(round.news)}:${round.liberal}:${round.fascist}:${round.tracker}:${round.outcome?.reason ?? ""}`
    : "";

  const [toast, setToast] = useState<string | null>(null);
  const [choice, setChoice] = useState<{ stage: string; id: string } | null>(null);
  const [seenNews, setSeenNews] = useState(newsKey);
  const [curtain, setCurtain] = useState<string | null>(null);

  if (newsKey !== seenNews) {
    setSeenNews(newsKey);
    setCurtain(round ? newsKey : null);
  }

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!newsKey) return;
    if (phase === "over") revealHit();
    else gavel();
  }, [newsKey, phase]);

  const lift = useCallback(() => setCurtain(null), []);

  const isHost = state.hostId === state.you;
  const lobby = !round;
  const alive = your?.alive ?? false;
  const nameOf = (id: string) =>
    round?.roster.find((p) => p.id === id)?.name ?? state.players.find((p) => p.id === id)?.name ?? "Someone";
  const chosen = choice?.stage === stage ? choice.id : null;
  const choose = (id: string) => setChoice({ stage, id });
  const beat = round ? newsBeat(round, newsKey, nameOf) : null;

  const send = async (action: ShAction, done: string) => {
    primeAudio();
    const r = await room.act(action);
    setToast(r.ok ? done : r.error.message);
    if (r.ok) setChoice(null);
  };
  const hostDo = async (fn: () => Promise<Result<Done>>, done: string) => {
    const r = await fn();
    setToast(r.ok ? done : r.error.message);
  };

  const president = round?.president ?? "";
  const chancellor = round?.chancellor ?? null;
  const youArePresident = alive && president === state.you;
  const power = round?.power ?? null;
  const picking =
    youArePresident && (phase === "nominate" || (phase === "power" && power !== null && power !== "peek"));

  const canTarget = (p: ShPublicPlayer) => {
    if (!picking || !p.alive || p.id === state.you) return false;
    if (phase === "nominate") return !p.termLimited;
    if (power === "investigate") return !p.investigated;
    return true;
  };

  const voting = phase === "vote";
  const living = round?.roster.filter((p) => p.alive).length ?? 0;
  const votesIn = round?.roster.filter((p) => p.voted).length ?? 0;
  const over = phase === "over";

  const slips: SeatSlip[] = (round?.roster ?? []).map((p) => {
    const seat = state.players.find((s) => s.id === p.id);
    const notes = [
      p.role ? ROLE_LABEL[p.role] : null,
      p.id === president && !over ? "President" : null,
      p.id === chancellor && !over ? (voting ? "Nominee" : phase === "nominate" ? null : "Chancellor") : null,
      voting && p.voted ? "voted" : null,
      p.termLimited && !over ? "term-limited" : null,
      p.notHitler && !over ? "not Hitler" : null,
    ].filter(Boolean);
    const won = over && p.role && round?.outcome?.winner === partyOf(p.role);
    return {
      id: p.id,
      name: p.name,
      you: p.id === state.you,
      away: seat ? !seat.connected : false,
      out: !p.alive,
      stamp: p.alive ? undefined : "Executed",
      note: notes.join(" · ") || undefined,
      badge: over ? (won ? "+1" : null) : p.id === president ? "P" : p.id === chancellor && phase !== "nominate" ? "C" : null,
      selected: chosen === p.id,
      open: canTarget(p),
    };
  });

  const headline = (): { title: string; line: string } => {
    if (!round) return { title: "", line: "" };
    if (over) return beat ?? { title: "Game over", line: "" };
    const p = nameOf(president);
    const c = chancellor ? nameOf(chancellor) : "";
    switch (phase) {
      case "nominate":
        return youArePresident
          ? { title: "Pick your Chancellor", line: "Tap a seat. Term-limited players can't take the job." }
          : { title: `${p} is President`, line: `${p} is picking a Chancellor. Lobby them.` };
      case "vote":
        return {
          title: `${p} and ${c}?`,
          line: `Vote Ja or Nein. Votes flip together once all ${living} are in.`,
        };
      case "president":
        return your?.hand
          ? { title: "Bin one policy", line: "Tap the one you're throwing away. The other two go to your Chancellor." }
          : { title: "Legislative session", line: `${p} is reading three policies. No talking.` };
      case "chancellor":
        return your?.hand
          ? { title: "Enact one policy", line: "Tap the one that becomes law. The other is binned, unseen." }
          : { title: "Legislative session", line: `${c} is picking one of two. No talking.` };
      case "veto":
        return youArePresident
          ? { title: `${c} wants a veto`, line: "Agree and both policies are binned. Refuse and they must enact one." }
          : { title: "Veto requested", line: `${c} wants to bin both policies. ${p} decides.` };
      case "power": {
        const label = power ? POWER_LABEL[power] : "";
        if (!youArePresident) return { title: label, line: `${p} has a presidential power to use.` };
        switch (power) {
          case "investigate":
            return { title: "Investigate", line: "Pick someone to see their party card. Only you will see it." };
          case "special-election":
            return { title: "Special election", line: "Pick who runs for President next. Then it comes back round to your left." };
          case "peek":
            return { title: "Policy peek", line: "The top three policies, in order. Only you can see them." };
          case "execute":
            return { title: "Execution", line: "Pick someone to execute. If they're Hitler, the Liberals win." };
          default:
            return { title: label, line: "" };
        }
      }
      default:
        return { title: "", line: "" };
    }
  };

  const news = round?.news;
  const checked =
    news?.kind === "investigated" ? your?.investigations.find((i) => i.playerId === news.targetId) : undefined;

  function privatePanel() {
    if (!round || !your || !alive || cutOff) return null;
    if (your.hand) {
      const verb = phase === "president" ? "Bin" : "Enact";
      return (
        <StitchedPanel title={`Your ${your.hand.length} policies`}>
          <div className="flex gap-3 pt-2 pb-1">
            {your.hand.map((policy, i) => (
              <PolicyTile key={i} policy={policy} selected={chosen === String(i)} onSelect={() => choose(String(i))} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold">
            {chosen === null ? `Tap one to ${verb.toLowerCase()} it.` : `${verb}: ${POLICY_LABEL[your.hand[Number(chosen)]]}.`}
          </p>
          {your.canVeto ? (
            <Button variant="tertiary" size="sm" className="mt-3" onClick={() => void send({ type: "veto" }, "Veto requested")}>
              Ask to veto both
            </Button>
          ) : null}
        </StitchedPanel>
      );
    }
    if (your.peek) {
      return (
        <StitchedPanel title="Top of the deck">
          <div className="flex gap-3 pt-2 pb-1">
            {your.peek.map((policy, i) => (
              <PolicyTile key={i} policy={policy} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold">Left is the next one drawn.</p>
        </StitchedPanel>
      );
    }
    if (checked) {
      return (
        <StitchedPanel title="Party card">
          <p className="pt-2 text-lg font-bold">
            {nameOf(checked.playerId)} is in the {POLICY_LABEL[checked.party]} party.
          </p>
          <p className="mt-1 text-sm opacity-80">Only you saw this. Tell the truth, or don&apos;t. It stays on your card.</p>
        </StitchedPanel>
      );
    }
    return null;
  }

  const target = chosen ? nameOf(chosen) : null;

  function band() {
    if (cutOff) {
      return (
        <div className="mb-band relative flex-col px-4 py-3 text-center">
          <p className="mb-display-sm text-base">{online ? "Reconnecting…" : "No signal"}</p>
          <p className="mb-caps text-[0.55rem] opacity-70">Your seat and your secrets are safe. Hang tight.</p>
        </div>
      );
    }
    const short = state.players.length < state.minPlayers;
    if (lobby || over) {
      return isHost ? (
        <BandButton
          onClick={() => {
            primeAudio();
            void room.start();
          }}
          disabled={short}
          detail={short ? `Need ${plural(state.minPlayers - state.players.length, "more player", "more players")}` : undefined}
        >
          {lobby ? "Deal the roles" : "Play again"}
        </BandButton>
      ) : (
        <p className="mb-band mb-display-sm flex-1 py-10 text-2xl">
          Waiting for {nameOf(state.hostId)} to {lobby ? "deal" : "deal again"}…
        </p>
      );
    }
    if (!your) return <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">Pull up a chair. You&apos;re in next game.</p>;
    if (!alive) return <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">You&apos;ve been executed. Ghosts don&apos;t talk.</p>;

    const waiting = (who: string) => <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">Waiting on {who}</p>;

    switch (phase) {
      case "nominate":
        return youArePresident ? (
          <BandButton
            disabled={!chosen}
            onClick={() => chosen && void send({ type: "nominate", targetId: chosen }, "Nominated")}
          >
            {target ? `Nominate ${target}` : "Pick a Chancellor"}
          </BandButton>
        ) : (
          waiting(nameOf(president))
        );
      case "vote":
        return your.vote === null ? (
          <>
            <BandButton onClick={() => void send({ type: "vote", ja: true }, "Ja! Ballot's in")} detail={`${votesIn} of ${living} in`}>
              Ja!
            </BandButton>
            <BandButton onClick={() => void send({ type: "vote", ja: false }, "Nein! Ballot's in")} detail={`${votesIn} of ${living} in`}>
              Nein
            </BandButton>
          </>
        ) : (
          <p className="mb-band mb-caps flex-1 py-10 text-center text-xs">
            You voted {your.vote ? "Ja" : "Nein"} · {votesIn} of {living} in
          </p>
        );
      case "president":
      case "chancellor":
        return your.hand ? (
          <BandButton
            disabled={chosen === null}
            onClick={() =>
              chosen !== null &&
              void send(
                { type: phase === "president" ? "discard" : "enact", index: Number(chosen) },
                phase === "president" ? "Passed to the Chancellor" : "Enacted",
              )
            }
          >
            {phase === "president" ? "Bin it" : "Enact it"}
          </BandButton>
        ) : (
          waiting(nameOf(phase === "president" ? president : (chancellor ?? "")))
        );
      case "veto":
        return youArePresident ? (
          <>
            <BandButton onClick={() => void send({ type: "veto:answer", agree: true }, "Vetoed")}>Agree</BandButton>
            <BandButton onClick={() => void send({ type: "veto:answer", agree: false }, "Veto refused")}>Refuse</BandButton>
          </>
        ) : (
          waiting(nameOf(president))
        );
      case "power":
        if (!youArePresident) return waiting(nameOf(president));
        if (power === "peek") return <BandButton onClick={() => void send({ type: "peek:done" }, "Back on the deck")}>Done peeking</BandButton>;
        return (
          <BandButton
            disabled={!chosen}
            onClick={() => chosen && power && void send({ type: power, targetId: chosen } as ShAction, "Done")}
          >
            {target ? `${POWER_LABEL[power!]}: ${target}` : "Pick a player"}
          </BandButton>
        );
      default:
        return null;
    }
  }

  const head = headline();
  const lastVote = round?.lastVote;

  return (
    <div {...theme(PAGE)} className="mb-stage flex h-dvh flex-col">
      <TapToast message={toast} />
      <RematchCountdown key={state.startsAt ?? "idle"} startsAt={state.startsAt} palette={PAGE} />
      <PhaseCurtain beat={beat && curtain === newsKey ? { ...beat, id: newsKey } : null} palette={PAGE} onDone={lift} />
      <div className="mb-label mb-label-bleed min-h-0 flex-1">
        <PaletteGrain palette={PAGE} tone="ink" className="absolute inset-0" />
        <div {...theme(PAGE, { flipped: true })} className="mb-label-field relative flex min-h-0 flex-1 flex-col">
          <h1 className="sr-only">Secret Hitler</h1>
          <PageCorners
            room={state.players}
            extra={
              <>
                <SideDrawer label="How to play" icon="?" title="How to play" className="mb-square-btn mb-display-sm text-2xl">
                  <SecretHitlerRules />
                </SideDrawer>
                <SideDrawer
                  label="Room"
                  icon={<Settings className="size-5" strokeWidth={2.5} aria-hidden />}
                  title={`Room ${state.code}`}
                  className="mb-square-btn"
                >
                  {isHost && round && !over ? (
                    <div className="space-y-1.5">
                      <Button variant="secondary" size="sm" onClick={() => hostDo(room.abort, "Game called off")}>
                        Call it off
                      </Button>
                      <p className="text-sm opacity-70">Ends this game with no winner, and shows every card.</p>
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
                      <p className="text-sm opacity-70">
                        For someone who has actually gone home. Mid-game it ends the game, because their secret role
                        leaves with them.
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

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-16 pb-44 sm:px-8">
            {lobby ? (
              <RoomLobby code={state.code} players={state.players} minPlayers={state.minPlayers} maxPlayers={state.maxPlayers}>
                {state.players.length >= state.minPlayers ? (
                  <p className="mb-caps text-sm">{shMixLine(state.players.length)}</p>
                ) : null}
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard
                      ?.writeText(`${window.location.origin}/secret-hitler/new?code=${state.code}`)
                      .then(() => setToast("Link copied. Send it to the table."));
                  }}
                >
                  Copy invite link
                </Button>
              </RoomLobby>
            ) : (
              <div className="mx-auto flex w-full max-w-md flex-col gap-5 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:gap-x-8">
                <header className="space-y-1.5 text-center lg:col-span-2">
                  <p className="mb-caps text-[0.55rem] opacity-60">
                    Room {state.code}
                    {reconnecting ? " · reconnecting" : ""}
                  </p>
                  <h2 className="mb-display mb-shadow text-4xl leading-none text-balance">{head.title}</h2>
                  <p className="text-sm font-semibold opacity-85">{head.line}</p>
                </header>
                <div className={cn("space-y-5", picking && "order-3 lg:order-none")}>
                  {your ? <RoleCard your={your} nameOf={nameOf} /> : null}
                  {privatePanel()}
                  <PolicyBoard
                    board={round.board}
                    liberal={round.liberal}
                    fascist={round.fascist}
                    tracker={round.tracker}
                    deckCount={round.deckCount}
                    discardCount={round.discardCount}
                  />
                </div>
                <div className={cn("space-y-3", picking && "order-2 lg:order-none")}>
                  <SeatBoard slips={slips} palette={PAGE} onSelect={choose} />
                  {lastVote ? (
                    <section className="border-t-[length:var(--rule-thin)] border-current pt-2 text-sm">
                      <h3 className="mb-caps text-xs">
                        Last vote · {nameOf(lastVote.president)} and {nameOf(lastVote.chancellor)} ·{" "}
                        {lastVote.passed ? "elected" : "rejected"}
                      </h3>
                      <p className="font-semibold">
                        Ja: {lastVote.ballots.filter((b) => b.ja).map((b) => nameOf(b.voterId)).join(", ") || "nobody"}
                      </p>
                      <p className="font-semibold">
                        Nein: {lastVote.ballots.filter((b) => !b.ja).map((b) => nameOf(b.voterId)).join(", ") || "nobody"}
                      </p>
                    </section>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="relative flex">{band()}</div>
      </div>
    </div>
  );
}
