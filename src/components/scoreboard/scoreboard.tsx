"use client";

import { useCallback, useMemo, useState } from "react";
import { Chip, Panel } from "@/components/mb/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colourwayById, colourwayVars } from "@/lib/colourways";
import { blip } from "@/lib/feedback";
import { useHydrated, usePersisted } from "@/lib/use-persisted";

type Player = { id: string; name: string; score: number };
type Snapshot = { players: Player[] };

const KEY = "scoreboard";
const STEP_KEY = "scoreboard:step";
const UNDO_DEPTH = 20;
const STEPS = [1, 5, 10];

export function Scoreboard() {
  const [players, setPlayers] = usePersisted<Player[]>(KEY, []);
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

  // Display order only — the stored list keeps entry order, so rows don't jump
  // around under a thumb that is mid-tap. Ties share a rank.
  const ranked = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const out: (Player & { rank: number })[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const p = sorted[i];
      const prev = out[i - 1];
      out.push({ ...p, rank: prev && prev.score === p.score ? prev.rank : i + 1 });
    }
    return out;
  }, [players]);

  const leaderScore = ranked[0]?.score ?? 0;
  const someoneScored = players.some((p) => p.score !== 0);

  if (!hydrated) return null;

  return (
    <div className="space-y-4">
      <Panel className="space-y-3">
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
          <Button onClick={addPlayer} disabled={!name.trim()} className="shrink-0">
            Add
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="mb-caps text-[0.6rem] opacity-60">Step</span>
            {STEPS.map((s) => (
              <Chip
                key={s}
                active={step === s}
                onClick={() => setStep(s)}
              >
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
            ↩ Undo
          </Button>
        </div>
      </Panel>

      {players.length === 0 ? (
        <Panel className="py-10 text-center">
          <p className="mb-display-sm text-2xl">Nobody&apos;s winning yet</p>
          <p className="mt-2 text-sm font-bold opacity-60">
            Add players or teams above. Works for cards, carrom, antakshari —
            anything.
          </p>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {ranked.map((p) => {
            const leading = someoneScored && p.score === leaderScore;
            return (
              <li
                key={p.id}
                style={
                  leading ? colourwayVars(colourwayById("mustard")) : undefined
                }
                className={`flex items-stretch overflow-hidden rounded-[var(--radius-lg)] border-[var(--rule-thin)] border-current ${
                  leading
                    ? "bg-[var(--field)] text-[var(--ink-on-field)]"
                    : "bg-[var(--ground-soft)]"
                }`}
              >
                <button
                  type="button"
                  aria-label={`Subtract ${step} from ${p.name}`}
                  onClick={() => bump(p.id, -step)}
                  className="w-14 shrink-0 border-r-[var(--rule-thin)] border-current text-2xl font-extrabold active:translate-y-[1px]"
                >
                  −
                </button>

                <div className="min-w-0 flex-1 px-3 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-black opacity-50">
                      #{p.rank}
                    </span>
                    <span className="truncate text-base font-bold">
                      {p.name}
                    </span>
                    {leading ? <span aria-hidden>👑</span> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={p.score}
                      onChange={(e) =>
                        setExact(p.id, Number(e.target.value) || 0)
                      }
                      aria-label={`${p.name} score`}
                      className="w-24 bg-transparent text-2xl font-extrabold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePlayer(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="text-xs font-bold underline decoration-2 opacity-40"
                    >
                      remove
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Add ${step} to ${p.name}`}
                  onClick={() => bump(p.id, step)}
                  className="w-14 shrink-0 border-l-[var(--rule-thin)] border-current text-2xl font-extrabold active:translate-y-[1px]"
                >
                  +
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

      {/* A mis-tap here loses a whole night of scores, so both confirm. */}
      {confirm ? (
        <Panel className="space-y-3" >
          <p className="mb-display-sm text-lg">
            {confirm === "reset"
              ? "Reset every score to zero? Names stay."
              : "Clear everything — names and scores?"}
          </p>
          <div className="flex gap-2">
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
        </Panel>
      ) : null}
    </div>
  );
}
