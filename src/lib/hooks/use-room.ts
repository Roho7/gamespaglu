"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { store } from "@/lib/state-adapter";
import { useHydrated, usePersisted } from "@/lib/hooks/use-persisted";
import {
  normaliseCode,
  type ClientToServer,
  type Done,
  type Err,
  type GameId,
  type GameTypes,
  type JoinedRoom,
  type Result,
  type RoomStateOf,
  type ServerToClient,
} from "@shared/protocol";

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? "http://localhost:8080";
const DEVICE_KEY = "rooms:device";

type RoomSocket = Socket<ServerToClient, ClientToServer>;

export type RoomStatus = "idle" | "connecting" | "in-room" | "error";

/** What a room hands its screens. The socket room and the in-browser local room both return one. */
export type RoomHandle<G extends GameId> = {
  state: RoomStateOf<G> | null;
  status: RoomStatus;
  error: Err | null;
  create: (name: string, settings?: Partial<GameTypes[G]["settings"]>) => Promise<Result<JoinedRoom>>;
  /** Absent where there is nobody to join, as in the local room. */
  join?: (name: string, code: string) => Promise<Result<JoinedRoom>>;
  leave: () => Promise<void>;
  kick: (playerId: string) => Promise<Result<Done>>;
  configure: (settings: Partial<GameTypes[G]["settings"]>) => Promise<Result<Done>>;
  start: () => Promise<Result<Done>>;
  abort: () => Promise<Result<Done>>;
  act: (action: GameTypes[G]["action"]) => Promise<Result<Done>>;
};

/**
 * Identity, entire: no accounts, and a cleared browser is a new person. Read from the store and
 * minted on demand rather than through React state, because an effect would run while the
 * hydration snapshot still looks empty and overwrite the real id, costing the player their seat.
 */
function deviceId(): string {
  const existing = store.get<string>(DEVICE_KEY, "");
  if (existing) return existing;
  const fresh = uuid();
  store.set(DEVICE_KEY, fresh);
  return fresh;
}

/** `randomUUID` exists only in secure contexts, and a phone on the dev server's LAN address is not one. */
export function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type Payload<E extends keyof ClientToServer> = Parameters<ClientToServer[E]>[0];
type Reply<E extends keyof ClientToServer> = Parameters<Parameters<ClientToServer[E]>[1]>[0];

/** A room over the game server's socket, for game `G`. */
export function useRoom<G extends GameId>(game: G): RoomHandle<G> {
  const [lastCode, setLastCode] = usePersisted<string>(`${game}:room`, "");
  const hydrated = useHydrated();
  const [state, setState] = useState<RoomStateOf<G> | null>(null);
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [error, setError] = useState<Err | null>(null);
  const socketRef = useRef<RoomSocket | null>(null);
  const statusRef = useRef<RoomStatus>("idle");

  const closed = useCallback(
    (e: Err) => {
      setError(e);
      setStatus("error");
      setState(null);
      setLastCode("");
    },
    [setLastCode],
  );

  const socket = useCallback((): RoomSocket => {
    if (socketRef.current) return socketRef.current;
    const s: RoomSocket = io(SERVER_URL, { transports: ["websocket"] });
    s.on("room:state", (next) => {
      if (next.game === game) setState(next as RoomStateOf<G>);
    });
    s.on("room:closed", closed);
    s.on("disconnect", () => setStatus("connecting"));
    socketRef.current = s;
    return s;
  }, [closed, game]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(
    () => () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    },
    [],
  );

  const call = useCallback(
    <E extends keyof ClientToServer>(event: E, payload: Payload<E>): Promise<Reply<E>> =>
      new Promise((resolve) => {
        const emit = socket().emit as (e: E, p: Payload<E>, ack: (r: Reply<E>) => void) => void;
        emit.call(socket(), event, payload, resolve);
      }),
    [socket],
  );

  const settle = useCallback(
    (r: Result<JoinedRoom>) => {
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
    async (name: string, settings?: Partial<GameTypes[G]["settings"]>) => {
      setStatus("connecting");
      return settle(await call("room:create", { deviceId: deviceId(), name, game, settings }));
    },
    [call, game, settle],
  );

  const join = useCallback(
    async (name: string, code: string) => {
      setStatus("connecting");
      return settle(
        await call("room:join", { deviceId: deviceId(), name, code: normaliseCode(code), game }),
      );
    },
    [call, game, settle],
  );

  const leave = useCallback(async () => {
    await call("room:leave", {});
    setLastCode("");
    setState(null);
    setStatus("idle");
  }, [call, setLastCode]);

  /** Resume on every connect: a reload, a phone waking and a redeploy must all restore the seat. */
  useEffect(() => {
    if (!hydrated || !lastCode) return;
    const s = socket();
    const resume = () => {
      if (statusRef.current !== "in-room") setStatus("connecting");
      s.emit("room:resume", { deviceId: deviceId(), code: lastCode }, (r) => {
        if (r.ok) {
          setStatus("in-room");
          setError(null);
        } else {
          setLastCode("");
          setStatus("idle");
          setError(r.error);
        }
      });
    };
    if (s.connected && statusRef.current !== "in-room") resume();
    s.on("connect", resume);
    return () => {
      s.off("connect", resume);
    };
  }, [hydrated, lastCode, socket, setLastCode]);

  return useMemo(
    () => ({
      state,
      status,
      error,
      create,
      join,
      leave,
      kick: (playerId: string) => call("room:kick", { playerId }),
      configure: (settings: Partial<GameTypes[G]["settings"]>) => call("room:settings", { settings }),
      start: () => call("round:start", {}),
      abort: () => call("round:abort", {}),
      act: (action: GameTypes[G]["action"]) => call("game:act", { action }),
    }),
    [state, status, error, create, join, leave, call],
  );
}
