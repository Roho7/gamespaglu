"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RuleError,
  abortRound,
  callVote,
  castVote,
  dealRound,
  expireClues,
  scoreRound,
  setClueSeconds,
  submitClue,
  submitEscape,
  type RoundState,
} from "@server/girgit/engine";
import { GRIDS } from "@server/girgit/grids";
import { publicRound, yourRound } from "@server/girgit/views";
import type { GirgitRoom, RoomStatus } from "@/lib/hooks/use-girgit-room";
import {
  ALL_PACKS,
  CLUE_SECONDS_OPTIONS,
  DEFAULT_CLUE_SECONDS,
  GRID_SIZE,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  normaliseName,
  type ErrorCode,
  type PlayerId,
  type Result,
  type RoomState,
} from "@shared/protocol";

const YOU = "local-you";
const BOT_NAMES = ["Asha", "Bunty", "Chiku", "Dolly", "Ekta", "Fatty"];
const BOT_COUNT = MIN_PLAYERS;
const BOT_CLUES = [
  "Obviously",
  "Classic",
  "Iconic",
  "Big energy",
  "Nostalgia",
  "Trust me",
  "Famous",
  "Loud",
  "Vibes",
  "Hmm",
];

type Player = { id: PlayerId; name: string; score: number };

type LocalRoom = {
  code: string;
  players: Player[];
  clueSeconds: number;
  packs: string[];
  roundNo: number;
  round: RoundState | null;
  usedGrids: string[];
};

const ok = { ok: true as const, data: { ok: true as const } };
const fail = (code: ErrorCode, message: string): Result<never> => ({
  ok: false,
  error: { code, message },
});
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const isBot = (id: PlayerId) => id !== YOU;

function randomCode() {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => pick([...ROOM_CODE_ALPHABET])).join("");
}

function project(room: LocalRoom): RoomState {
  const round = room.round;
  return {
    code: room.code,
    game: "girgit",
    phase: round?.phase ?? "lobby",
    roundNo: room.roundNo,
    players: room.players.map((p, seat) => ({
      id: p.id,
      name: p.name,
      seat,
      connected: true,
      pendingLeave: false,
      isHost: p.id === YOU,
      score: p.score,
    })),
    hostId: YOU,
    you: YOU,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    clueSeconds: room.clueSeconds,
    packs: room.packs,
    round: round ? publicRound(round, room.roundNo) : null,
    your: round ? yourRound(round, YOU) : null,
  };
}

/**
 * A Girgit room that never leaves the browser, for playing the whole flow
 * alone in development. Same engine and views as the socket server; the other
 * seats are bots.
 *
 * Bots clue on their own, then wait for your vote: as the Girgit they all
 * accuse you, so you reach the escape guess; as an innocent they follow your
 * pick, so you choose whether the Girgit is caught.
 */
export function useLocalGirgitRoom(): GirgitRoom {
  const roomRef = useRef<LocalRoom | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");

  const publish = useCallback(() => {
    setState(roomRef.current ? project(roomRef.current) : null);
  }, []);

  const update = useCallback(
    (fn: (room: LocalRoom) => LocalRoom) => {
      if (roomRef.current) roomRef.current = fn(roomRef.current);
      publish();
    },
    [publish],
  );

  const later = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) clearTimeout(id);
    timers.current.clear();
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const settle = useCallback(
    (next: RoundState) =>
      update((room) => {
        if (room.round?.outcome || !next.outcome) return { ...room, round: next };
        const delta = scoreRound(next);
        return {
          ...room,
          round: next,
          players: room.players.map((p) => ({ ...p, score: p.score + (delta[p.id] ?? 0) })),
        };
      }),
    [update],
  );

  const apply = useCallback(
    (fn: (s: RoundState) => RoundState): Result<{ ok: true }> => {
      const round = roomRef.current?.round;
      if (!round) return fail("WRONG_PHASE", "No round is running.");
      try {
        settle(fn(round));
        return ok;
      } catch (err) {
        if (err instanceof RuleError) return fail(err.code, err.message);
        throw err;
      }
    },
    [settle],
  );

  const botsClue = useCallback(
    (roundNo: number) => {
      for (const id of roomRef.current?.round?.players.filter(isBot) ?? []) {
        later(1500 + Math.random() * 5000, () => {
          const room = roomRef.current;
          if (room?.roundNo !== roundNo || room.round?.phase !== "clues") return;
          for (const word of [pick(BOT_CLUES), ...BOT_CLUES]) {
            if (apply((s) => submitClue(s, id, word)).ok) break;
          }
        });
      }
    },
    [apply, later],
  );

  const botsVote = useCallback(
    (yourTarget: PlayerId) => {
      const round = roomRef.current?.round;
      if (!round) return;
      const roundNo = roomRef.current?.roundNo;
      const others = (id: PlayerId) => round.players.filter((p) => p !== id);
      round.players.filter(isBot).forEach((id, i) => {
        const wanted = round.girgit === YOU ? YOU : yourTarget;
        const target = wanted !== id ? wanted : pick(others(id).filter((p) => p !== YOU));
        later(600 + i * 500, () => {
          if (roomRef.current?.roundNo !== roundNo) return;
          apply((s) => castVote(s, id, target));
          const now = roomRef.current?.round;
          if (now?.phase === "escape" && isBot(now.girgit)) {
            const girgit = now.girgit;
            later(2500, () => {
              const guess =
                Math.random() < 1 / 3
                  ? now.secretIndex
                  : Math.floor(Math.random() * GRID_SIZE);
              apply((s) => submitEscape(s, girgit, guess));
            });
          }
        });
      });
    },
    [apply, later],
  );

  useEffect(() => {
    if (state?.phase !== "clues") return;
    const id = setInterval(() => {
      const round = roomRef.current?.round;
      if (round?.phase === "clues" && round.deadlineAt && round.deadlineAt <= Date.now()) {
        settle(expireClues(round));
      }
    }, 500);
    return () => clearInterval(id);
  }, [state?.phase, settle]);

  const create = useCallback(
    async (name: string) => {
      clearTimers();
      const code = randomCode();
      roomRef.current = {
        code,
        players: [{ id: YOU, name: normaliseName(name) || "You", score: 0 }],
        clueSeconds: DEFAULT_CLUE_SECONDS,
        packs: ALL_PACKS,
        roundNo: 0,
        round: null,
        usedGrids: [],
      };
      setStatus("in-room");
      publish();
      for (let i = 0; i < BOT_COUNT; i++) {
        later(400 + i * 350, () =>
          update((room) => ({
            ...room,
            players: [
              ...room.players,
              { id: `local-bot-${i}`, name: BOT_NAMES[i % BOT_NAMES.length], score: 0 },
            ],
          })),
        );
      }
      return { ok: true as const, data: { code } };
    },
    [clearTimers, later, publish, update],
  );

  const leave = useCallback(async () => {
    clearTimers();
    roomRef.current = null;
    setStatus("idle");
    publish();
  }, [clearTimers, publish]);

  const act: GirgitRoom["act"] = {
    setClueSeconds: async (seconds) => {
      const room = roomRef.current;
      if (!room) return fail("NOT_IN_ROOM", "You are not in a room.");
      if (!CLUE_SECONDS_OPTIONS.includes(seconds as (typeof CLUE_SECONDS_OPTIONS)[number])) {
        return fail("BAD_SETTING", "Not a timer option.");
      }
      update((r) => ({
        ...r,
        clueSeconds: seconds,
        round: r.round ? setClueSeconds(r.round, seconds) : null,
      }));
      return ok;
    },
    setPacks: async (packs) => {
      const room = roomRef.current;
      if (!room) return fail("NOT_IN_ROOM", "You are not in a room.");
      const chosen = packs.filter((p) => (ALL_PACKS as string[]).includes(p));
      if (chosen.length === 0) return fail("BAD_SETTING", "Keep at least one pack on.");
      update((r) => ({ ...r, packs: chosen }));
      return ok;
    },
    startRound: async () => {
      const room = roomRef.current;
      if (!room) return fail("NOT_IN_ROOM", "You are not in a room.");
      if (room.round && room.round.phase !== "reveal") {
        return fail("WRONG_PHASE", "Finish this round first.");
      }
      const inPlay = GRIDS.filter((g) => room.packs.includes(g.pack));
      const unseen = inPlay.filter((g) => !room.usedGrids.includes(g.id));
      const bag = unseen.length ? unseen : inPlay.filter((g) => g.id !== room.round?.gridId);
      const grid = pick(bag.length ? bag : inPlay);
      let round: RoundState;
      try {
        round = dealRound(
          room.players.map((p) => p.id),
          grid,
          Math.random,
          Date.now,
          room.clueSeconds,
        );
      } catch (err) {
        if (err instanceof RuleError) return fail(err.code, err.message);
        throw err;
      }
      update((r) => ({
        ...r,
        round,
        roundNo: r.roundNo + 1,
        usedGrids: [...r.usedGrids, grid.id],
      }));
      botsClue(room.roundNo + 1);
      return ok;
    },
    abortRound: async () => apply(abortRound),
    submitClue: async (word) => apply((s) => submitClue(s, YOU, word)),
    callVote: async () => apply((s) => callVote(s, YOU)),
    castVote: async (targetId) => {
      const r = apply((s) => castVote(s, YOU, targetId));
      if (r.ok) botsVote(targetId);
      return r;
    },
    escapeGuess: async (cellIndex) => apply((s) => submitEscape(s, YOU, cellIndex)),
  };

  return { state, status, error: null, create, leave, act };
}
