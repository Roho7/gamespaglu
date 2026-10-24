"use client";

import { usePersisted } from "@/lib/hooks/use-persisted";

/** A scoreboard row. A team carries the names of its `members`. */
export type ScoreboardPlayer = {
  id: string;
  name: string;
  score: number;
  members?: string[];
};

const KEY = "scoreboard";

/** The one persisted scoreboard, shared by the drawer, /scoreboard and the games that keep score. */
export function useScoreboard() {
  return usePersisted<ScoreboardPlayer[]>(KEY, []);
}

/** Adds each award to its row; awards for rows removed mid-game are dropped. */
export function addPoints(
  players: ScoreboardPlayer[],
  awards: { seat: string; points: number }[],
): ScoreboardPlayer[] {
  return players.map((p) => ({
    ...p,
    score:
      p.score +
      awards.filter((a) => a.seat === p.id).reduce((s, a) => s + a.points, 0),
  }));
}
