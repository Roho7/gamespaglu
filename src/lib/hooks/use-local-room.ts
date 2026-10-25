"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BotBrain } from "@server/game/bot";
import { GameError } from "@server/game/errors";
import { MemoryRoomStore } from "@server/game/memory-store";
import { createGames } from "@server/game/registry";
import type { RoomRecord } from "@server/game/room";
import { RoomService } from "@server/game/service";
import { GRIDS } from "@server/girgit/grids";
import { uuid, type RoomHandle, type RoomStatus } from "@/lib/hooks/use-room";
import type {
  Done,
  GameId,
  GameTypes,
  PlayerId,
  Result,
  RoomStateOf,
} from "@shared/protocol";

export type LocalRoomOptions = { brain: BotBrain; names: readonly string[] };

const SWEEP_MS = 500;
const ARRIVAL_MS = 350;
const NOT_IN_ROOM: Result<never> = {
  ok: false,
  error: { code: "NOT_IN_ROOM", message: "You are not in a room." },
};

async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof GameError) return { ok: false, error: err.err };
    throw err;
  }
}

/**
 * A room that never leaves the browser, for playing a whole game alone in development. It runs the
 * real room service over an in-memory store, so every rule is the server's; the other seats are bots.
 */
export function useLocalRoom<G extends GameId>(
  game: G,
  { brain, names }: LocalRoomOptions,
): RoomHandle<G> {
  const service = useMemo(
    () =>
      new RoomService({
        store: new MemoryRoomStore(),
        games: createGames(GRIDS),
        rng: Math.random,
        now: Date.now,
        newId: uuid,
      }),
    [],
  );
  const [state, setState] = useState<RoomStateOf<G> | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const latest = useRef<RoomRecord | null>(null);
  const active = useRef("");
  const you = useRef<PlayerId>("");
  const thinking = useRef(new Set<PlayerId>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  const stop = useCallback(() => {
    for (const id of timers.current) clearTimeout(id);
    timers.current.clear();
    thinking.current.clear();
    latest.current = null;
    active.current = "";
  }, []);

  useEffect(() => stop, [stop]);

  const publishRef = useRef<(room: RoomRecord | null) => void>(() => undefined);

  const publish = useCallback(
    (room: RoomRecord | null) => {
      if (!active.current || (room && room.code !== active.current)) return;
      latest.current = room;
      setState(room ? (service.view(room, you.current) as RoomStateOf<G>) : null);
      if (!room) return;
      for (const p of room.players) {
        if (p.id === you.current || thinking.current.has(p.id)) continue;
        const move = brain(room, p.id, you.current, Math.random);
        if (!move) continue;
        thinking.current.add(p.id);
        later(move.delayMs, () => {
          thinking.current.delete(p.id);
          const now = latest.current;
          if (!now) return;
          void service.act(now.code, p.id, move.action).then(
            (next) => publishRef.current(next),
            () => publishRef.current(latest.current),
          );
        });
      }
    },
    [brain, later, service],
  );

  useEffect(() => {
    publishRef.current = publish;
  }, [publish]);

  const change = useCallback(
    (fn: (code: string) => Promise<RoomRecord | null>): Promise<Result<Done>> => {
      const code = latest.current?.code;
      if (!code) return Promise.resolve(NOT_IN_ROOM);
      return attempt(async () => {
        publish(await fn(code));
        return { ok: true as const };
      });
    },
    [publish],
  );

  useEffect(() => {
    if (status !== "in-room") return;
    const id = setInterval(() => {
      void service.sweep(() => undefined).then((changed) => changed.forEach(publish));
    }, SWEEP_MS);
    return () => clearInterval(id);
  }, [publish, service, status]);

  const create = useCallback(
    (name: string, settings?: Partial<GameTypes[G]["settings"]>) =>
      attempt(async () => {
        stop();
        const seated = await service.create(game, uuid(), name, settings);
        you.current = seated.playerId;
        active.current = seated.room.code;
        setStatus("in-room");
        publish(seated.room);
        names.forEach((botName, i) =>
          later(ARRIVAL_MS * (i + 1), () => {
            void service.join(seated.room.code, game, uuid(), botName).then((b) => publish(b.room));
          }),
        );
        return { code: seated.room.code, playerId: seated.playerId };
      }),
    [game, later, names, publish, service, stop],
  );

  const leave = useCallback(async () => {
    stop();
    setState(null);
    setStatus("idle");
  }, [stop]);

  return useMemo(
    () => ({
      state,
      status,
      error: null,
      create,
      leave,
      kick: (playerId: string) => change((code) => service.kick(code, you.current, playerId)),
      configure: (settings: Partial<GameTypes[G]["settings"]>) =>
        change((code) => service.configure(code, you.current, settings)),
      start: () => change((code) => service.start(code, you.current)),
      abort: () => change((code) => service.abort(code, you.current)),
      act: (action: GameTypes[G]["action"]) =>
        change((code) => service.act(code, you.current, action)),
    }),
    [state, status, create, leave, change, service],
  );
}
