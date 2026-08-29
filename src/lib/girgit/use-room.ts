"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { store } from "@/lib/state-adapter";
import { useHydrated, usePersisted } from "@/lib/use-persisted";
import {
  normaliseCode,
  type ClientToServer,
  type Err,
  type Result,
  type RoomState,
  type ServerToClient,
} from "@shared/protocol";

const SERVER_URL =
  process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "http://localhost:8080";

type GirgitSocket = Socket<ServerToClient, ClientToServer>;

const DEVICE_KEY = "girgit:device";

/**
 * Identity, entire. No accounts: a cleared browser is a new person.
 *
 * Read straight from the store and minted on demand — deliberately NOT through
 * React state. useSyncExternalStore hands back the *server* snapshot during the
 * hydration render, and effects run after that commit, so a
 * `useEffect(() => { if (!id) mint() })` fires while the value still looks
 * empty and overwrites the real one. That silently issued a new identity on
 * every reload, which cost the player their seat.
 *
 * This is the corollary of the rule in CLAUDE.md: don't read localStorage into
 * state in an effect, and don't write to it from one either.
 */
function deviceId(): string {
  const existing = store.get<string>(DEVICE_KEY, "");
  if (existing) return existing;
  const fresh =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  store.set(DEVICE_KEY, fresh);
  return fresh;
}

export type RoomStatus = "idle" | "connecting" | "in-room" | "error";

export function useRoom() {
  // The last room this device sat in. This is what makes closing the app and
  // coming back work at all — without it, a reload is a stranger.
  const [lastCode, setLastCode] = usePersisted<string>("girgit:room", "");
  const hydrated = useHydrated();

  const [state, setState] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<Err | null>(null);
  const socketRef = useRef<GirgitSocket | null>(null);
  // Mirrored into a ref so the resume effect can read the current status
  // without depending on it — depending on it would tear the socket down and
  // rebuild it every time the status changed.
  const statusRef = useRef<RoomStatus>("idle");

  const socket = useCallback((): GirgitSocket => {
    if (socketRef.current) return socketRef.current;
    const s: GirgitSocket = io(SERVER_URL, { transports: ["websocket"] });
    s.on("room:state", setState);
    s.on("room:closed", (e) => {
      setError(e);
      setStatus("error");
      setState(null);
      setLastCode("");
    });
    s.on("disconnect", () => setStatus("connecting"));
    socketRef.current = s;
    return s;
  }, [setLastCode]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const call = useCallback(
    <T,>(event: keyof ClientToServer, payload: object): Promise<Result<T>> =>
      new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket() as any).emit(event, payload, resolve);
      }),
    [socket],
  );

  const settle = useCallback(
    (r: Result<{ code: string }>) => {
      if (r.ok) {
        setLastCode(r.data.code);
        setStatus("in-room");
        setError(null);
      } else {
        setError(r.error);
        setStatus("error");
      }
      return r;
    },
    [setLastCode],
  );

  const create = useCallback(
    async (name: string) => {
      setStatus("connecting");
      return settle(await call("room:create", { deviceId: deviceId(), name }));
    },
    [call, settle],
  );

  const join = useCallback(
    async (name: string, code: string) => {
      setStatus("connecting");
      return settle(
        await call("room:join", { deviceId: deviceId(), name, code: normaliseCode(code) }),
      );
    },
    [call, settle],
  );

  const leave = useCallback(async () => {
    await call("room:leave", {});
    setLastCode("");
    setState(null);
    setStatus("idle");
  }, [call, setLastCode]);

  const kick = useCallback(
    (playerId: string) => call("room:kick", { playerId }),
    [call],
  );

  const act = {
    setClueSeconds: useCallback(
      (seconds: number) => call("room:clueSeconds", { seconds }),
      [call],
    ),
    startRound: useCallback(() => call("round:start", {}), [call]),
    abortRound: useCallback(() => call("round:abort", {}), [call]),
    submitClue: useCallback((word: string) => call("clue:submit", { word }), [call]),
    callVote: useCallback(() => call("vote:call", {}), [call]),
    castVote: useCallback((targetId: string) => call("vote:cast", { targetId }), [call]),
    escapeGuess: useCallback(
      (cellIndex: number) => call("escape:guess", { cellIndex }),
      [call],
    ),
  };

  /**
   * Resume runs on every connect, not just the first: a reload, a phone waking
   * from lock, and a server redeploy all land here, and all three must restore
   * the seat with no rejoin dance.
   */
  useEffect(() => {
    if (!hydrated || !lastCode) return;
    const s = socket();
    const resume = () => {
      // Joining already put us in the room. Re-announcing "connecting" here
      // flashed "Reconnecting…" across the band the instant anybody joined,
      // which reads as a fault rather than a successful join.
      if (statusRef.current !== "in-room") setStatus("connecting");
      s.emit(
        "room:resume",
        { deviceId: deviceId(), code: lastCode },
        (r: Result<{ code: string }>) => {
          if (r.ok) {
            setStatus("in-room");
            setError(null);
          } else {
            // The seat is genuinely gone — say so rather than hanging.
            setLastCode("");
            setStatus("idle");
            setError(r.error);
          }
        },
      );
    };
    if (s.connected && statusRef.current !== "in-room") resume();
    // A genuine reconnect always resumes, whatever the status was.
    s.on("connect", resume);
    return () => {
      s.off("connect", resume);
    };
  }, [hydrated, lastCode, socket, setLastCode]);

  return { state, status, error, create, join, leave, kick, lastCode, act };
}
