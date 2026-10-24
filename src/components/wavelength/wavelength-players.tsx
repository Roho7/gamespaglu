"use client";

import { useState } from "react";
import { ArrowLeft, ArrowLeftRight, X } from "lucide-react";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WAVELENGTH_MODES } from "@/content/guides";
import type { ScoreboardPlayer } from "@/lib/hooks/use-scoreboard";
import type { Mode, Seat } from "@/lib/wavelength/engine";

export type TeamId = "a" | "b";
/** A name on the Wavelength roster; `team` is only read in Teams. */
export type RosterPlayer = { id: string; name: string; team: TeamId };

export const TEAM_NAMES: Record<TeamId, string> = { a: "Team A", b: "Team B" };
const MAX_PLAYERS = 16;

function newId(n: number) {
  return `${Date.now().toString(36)}-${n}-${Math.random().toString(36).slice(2, 6)}`;
}

/** A first roster from whoever is already on the scoreboard, teams alternating. */
export function rosterFromScoreboard(
  players: ScoreboardPlayer[],
): RosterPlayer[] {
  const names = players.flatMap((p) =>
    p.members?.length ? p.members : [p.name],
  );
  return [...new Set(names)]
    .slice(0, MAX_PLAYERS)
    .map((name, i) => ({ id: newId(i), name, team: i % 2 ? "b" : "a" }));
}

/** The seats a roster plays as: every player in their own seat, or two teams. */
export function seatsFor(mode: Mode, roster: RosterPlayer[]): Seat[] {
  if (mode !== "teams")
    return roster.map((p) => ({ id: p.id, name: p.name, members: [] }));
  return (["a", "b"] as const).map((team) => ({
    id: `team-${team}`,
    name: TEAM_NAMES[team],
    members: roster.filter((p) => p.team === team).map((p) => p.name),
  }));
}

function PlayerRow({
  player,
  onSwap,
  onRemove,
}: {
  player: RosterPlayer;
  onSwap?: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-2 border-b-[length:var(--rule-thin)] border-[var(--cw-shadow)]/30 py-1.5">
      <span className="mb-display-sm min-w-0 flex-1 truncate text-xl">
        {player.name}
      </span>
      {onSwap ? (
        <button
          type="button"
          onClick={onSwap}
          aria-label={`Move ${player.name} to ${TEAM_NAMES[player.team === "a" ? "b" : "a"]}`}
          className="mb-square-btn size-9"
        >
          <ArrowLeftRight className="size-4" strokeWidth={3} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${player.name}`}
        className="mb-square-btn size-9"
      >
        <X className="size-4" strokeWidth={3} aria-hidden />
      </button>
    </li>
  );
}

/**
 * Who's playing. The names here become the scoreboard when the game starts:
 * one row per player, or one per team with its members under it.
 */
export function WavelengthPlayers({
  mode,
  roster,
  problem,
  onRoster,
  onBack,
}: {
  mode: Mode;
  roster: RosterPlayer[];
  problem: string | null;
  onRoster: (next: RosterPlayer[]) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const taken = roster.some(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const full = roster.length >= MAX_PLAYERS;
  const teams = mode === "teams";

  const add = () => {
    if (!trimmed || taken || full) return;
    const count = (t: TeamId) => roster.filter((p) => p.team === t).length;
    const team: TeamId = count("b") < count("a") ? "b" : "a";
    onRoster([...roster, { id: newId(roster.length), name: trimmed, team }]);
    setName("");
  };

  const remove = (id: string) => onRoster(roster.filter((p) => p.id !== id));
  const swap = (id: string) =>
    onRoster(
      roster.map((p) =>
        p.id === id ? { ...p, team: p.team === "a" ? "b" : "a" } : p,
      ),
    );

  const note = taken
    ? `${trimmed} is already playing.`
    : full
      ? `That's ${MAX_PLAYERS}, the most one phone can pass round.`
      : (problem ?? "Starting resets the scoreboard to these players.");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-1">
      <button
        type="button"
        aria-label="Back to the rules"
        onClick={onBack}
        className="mb-square-btn ml-1"
      >
        <ArrowLeft className="size-5" strokeWidth={3} aria-hidden />
      </button>
      <StitchedPanel title="Who's playing?" className="flex-1 basis-0">
        <p className="mb-caps text-[0.65rem] opacity-80">
          {WAVELENGTH_MODES[mode].name} · {WAVELENGTH_MODES[mode].players}
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            aria-label="Player name"
            maxLength={24}
            enterKeyHint="done"
          />
          <Button
            type="submit"
            disabled={!trimmed || taken || full}
            className="shrink-0"
          >
            Add
          </Button>
        </form>
        <p role="status" className="mt-2 min-h-5 text-sm font-semibold">
          {note}
        </p>
        {teams ? (
          <div className="mt-2 space-y-4">
            {(["a", "b"] as const).map((team) => {
              const members = roster.filter((p) => p.team === team);
              return (
                <section key={team}>
                  <h3 className="mb-caps text-xs">
                    {TEAM_NAMES[team]} · {members.length}
                  </h3>
                  {members.length ? (
                    <ul>
                      {members.map((p) => (
                        <PlayerRow
                          key={p.id}
                          player={p}
                          onSwap={() => swap(p.id)}
                          onRemove={() => remove(p.id)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="py-1.5 text-sm font-medium opacity-70">
                      Nobody yet.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        ) : roster.length ? (
          <ul className="mt-2">
            {roster.map((p) => (
              <PlayerRow key={p.id} player={p} onRemove={() => remove(p.id)} />
            ))}
          </ul>
        ) : null}
      </StitchedPanel>
    </div>
  );
}
