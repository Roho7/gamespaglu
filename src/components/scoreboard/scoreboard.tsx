"use client";

import { useCallback, useMemo, useState } from "react";
import { Chip } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Minus, Plus, Undo2 } from "lucide-react";
import { StitchBorder } from "@/components/stitch/stitch-border";
import { PALETTES, theme } from "@/lib/palettes";
import { blip } from "@/lib/sound-and-haptics";
import { useHydrated, usePersisted } from "@/lib/hooks/use-persisted";
import {
  useScoreboard,
  type ScoreboardPlayer as Player,
} from "@/lib/hooks/use-scoreboard";

type Snapshot = { players: Player[] };

const STEP_KEY = "scoreboard:step";
const UNDO_DEPTH = 20;
const STEPS = [1, 5, 10];

export function Scoreboard() {
  const [players, setPlayers] = useScoreboard();
  const [step, setStep] = usePersisted<number>(STEP_KEY, 1);
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [confirm, setConfirm] = useState<null | "reset" | "new">(null);

  const commit = useCallback(
    (next: Player[], recordUndo = true) => {
      if (recordUndo) {
        setHistory((h) => [{ players }, ...h].slice(0, UNDO_DEPTH));
      }
      setPlayers(next);
    },
    [players, setPlayers],
  );

  const addPlayer = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    commit([
      ...players,
      { id: `${Date.now()}-${players.length}`, name: trimmed, score: 0 },
    ]);
    setName("");
    blip();
  };

  const bump = (id: string, delta: number) => {
    commit(
      players.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)),
    );
    blip();
  };

  const setExact = (id: string, value: number) => {
    commit(players.map((p) => (p.id === id ? { ...p, score: value } : p)));
  };

  const removePlayer = (id: string) => {
    commit(players.filter((p) => p.id !== id));
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const [last, ...rest] = h;
      setPlayers(last.players);
      return rest;
    });
  };

  const ranked = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const out: (Player & { rank: number })[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const prev = out[i - 1];
      out.push({
        ...p,
        rank: prev && prev.score === p.score ? prev.rank : i + 1,
      });
    }
    return out;
  }, [players]);

  const leaderScore = ranked[0]?.score ?? 0;
  const someoneScored = players.some((p) => p.score !== 0);

  if (!hydrated) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addPlayer();
            }}
            placeholder="Add player or team"
            aria-label="Add player or team"
          />
          <Button
            onClick={addPlayer}
            disabled={!name.trim()}
            className="shrink-0"
          >
            Add
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="mb-caps text-[0.6rem] opacity-70">Step</span>
            {STEPS.map((s) => (
              <Chip key={s} active={step === s} onClick={() => setStep(s)}>
                {s}
              </Chip>
            ))}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={undo}
            disabled={history.length === 0}
          >
            <Undo2 className="size-4" strokeWidth={2.5} aria-hidden /> Undo
          </Button>
        </div>
      </div>

      {players.length === 0 ? (
        <div
          {...theme(PALETTES[0])}
          className="mb-label relative px-8 py-12 text-center"
        >
          <StitchBorder className="inset-2" />
          <p className="mb-display mb-shadow text-4xl">
            Nobody&apos;s winning yet
          </p>
          <p className="mt-3 text-sm font-semibold">
            Add players or teams above. Works for cards, carrom, antakshari —
            anything.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ranked.map((p) => {
            const leading = someoneScored && p.score === leaderScore;
            const palette =
              PALETTES[
                players.findIndex((q) => q.id === p.id) % PALETTES.length
              ];
            return (
              <li
                key={p.id}
                {...theme(palette)}
                className="mb-label relative flex flex-row items-center gap-3 px-5 py-5"
              >
                <StitchBorder className="inset-1.5" />
                <button
                  type="button"
                  aria-label={`Subtract ${step} from ${p.name}`}
                  onClick={() => bump(p.id, -step)}
                  className="mb-square-btn relative shrink-0"
                >
                  <Minus className="size-5" strokeWidth={3} aria-hidden />
                </button>

                <div className="relative min-w-0 flex-1 text-center">
                  <p className="mb-caps flex items-center justify-center gap-1.5 text-[0.6rem]">
                    <span className="opacity-70">#{p.rank}</span>
                    {leading ? (
                      <>
                        <Crown
                          className="size-3.5"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        <span>Leading</span>
                      </>
                    ) : null}
                  </p>
                  <p className="mb-display-sm truncate text-2xl">{p.name}</p>
                  {p.members?.length ? (
                    <p className="truncate text-xs font-semibold opacity-75">
                      {p.members.join(", ")}
                    </p>
                  ) : null}
                  <input
                    type="number"
                    inputMode="numeric"
                    value={p.score}
                    onChange={(e) =>
                      setExact(p.id, Number(e.target.value) || 0)
                    }
                    aria-label={`${p.name} score`}
                    className={`mb-display w-full bg-transparent text-center text-5xl leading-none outline-none ${leading ? "mb-shadow" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => removePlayer(p.id)}
                    aria-label={`Remove ${p.name}`}
                    className="mb-caps text-[0.55rem] underline decoration-2 opacity-60"
                  >
                    Remove
                  </button>
                </div>

                <button
                  type="button"
                  aria-label={`Add ${step} to ${p.name}`}
                  onClick={() => bump(p.id, step)}
                  className="mb-square-btn relative shrink-0"
                >
                  <Plus className="size-5" strokeWidth={3} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {players.length > 0 ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setConfirm("reset")}
          >
            Reset scores
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setConfirm("new")}
          >
            New game
          </Button>
        </div>
      ) : null}

      {confirm ? (
        <div
          {...theme(PALETTES[0])}
          className="mb-label relative space-y-3 p-6"
        >
          <StitchBorder className="inset-1.5" />
          <p className="mb-display-sm relative text-xl">
            {confirm === "reset"
              ? "Reset every score to zero? Names stay."
              : "Clear everything — names and scores?"}
          </p>
          <div className="relative flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                if (confirm === "reset") {
                  commit(players.map((p) => ({ ...p, score: 0 })));
                } else {
                  commit([]);
                }
                setConfirm(null);
              }}
            >
              Yes, do it
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
