import http from "node:http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server, type Socket } from "socket.io";
import { env } from "./env";
import { ping, pool } from "./db";
import {
  RoomError,
  createRoom,
  getRoomSnapshot,
  joinRoom,
  kickPlayer,
  leaveRoom,
  reapExpiredRooms,
  resumeRoom,
  roomStateFrom,
  setConnected,
} from "./rooms";
import {
  RuleError,
  abortRound,
  callVote,
  castVote,
  expireClues,
  setClueSeconds,
  scoreRound,
  submitClue,
  submitEscape,
} from "./girgit/engine";
import {
  applyScores,
  currentRound,
  expiredRooms,
  publicRound,
  startRound,
  transition,
  yourRound,
} from "./girgit/store";
import {
  CLUE_SECONDS_OPTIONS,
  MAX_NAME_LENGTH,
  isDeviceId,
  isRoomCode,
  normaliseCode,
  normaliseName,
  type Ack,
  type ClientToServer,
  type Err,
  type ServerToClient,
} from "../../shared/protocol";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.allowedOrigins }));

app.get("/health", async (_req, res) => {
  try {
    await ping();
    res.json({ ok: true });
  } catch {
    // Fly's health check should fail if the database is unreachable: a server
    // that accepts sockets it cannot persist is worse than one that is down.
    res.status(503).json({ ok: false, db: false });
  }
});

const server = http.createServer(app);

type SocketData = { playerId?: string; code?: string };
const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(
  server,
  { cors: { origin: env.allowedOrigins }, pingTimeout: 30_000 },
);

/**
 * State is broadcast per socket rather than to the room, because `you` differs
 * for every recipient. This is the same shape the secret deal needs in M3 —
 * innocents get the word, the Girgit gets null — and it is the reason this is
 * a socket server rather than Supabase Realtime, whose broadcast is
 * all-or-nothing to a channel.
 */
async function broadcastState(code: string) {
  const sockets = await io.in(code).fetchSockets();
  try {
    // Everything expensive happens once, outside the loop. Only the shaping is
    // per recipient — which is the whole point: the payload differs by exactly
    // one field and one nested object.
    const [snapshot, round] = await Promise.all([
      getRoomSnapshot(code),
      currentRound(code),
    ]);
    const publicView = round ? publicRound(round, snapshot.room.round_no) : null;

    for (const s of sockets) {
      const you = s.data.playerId;
      if (!you) continue;
      // The per-socket half: innocents get secretIndex, the Girgit gets null.
      const view =
        round && publicView
          ? { publicView, yourView: yourRound(round, you) }
          : undefined;
      s.emit("room:state", roomStateFrom(snapshot, you, view));
    }
  } catch (err) {
    if (err instanceof RoomError) {
      for (const s of sockets) s.emit("room:closed", err.err);
      return;
    }
    throw err;
  }
}

const INTERNAL: Err = { code: "INTERNAL", message: "Something broke on our side." };

/** Every handler returns failure in the ack; nothing rejects into the void. */
function handle<T>(ack: Ack<T>, fn: () => Promise<T>) {
  return fn().then(
    (data) => ack({ ok: true, data }),
    (err) => {
      if (err instanceof RoomError) return ack({ ok: false, error: err.err });
      // The engine throws its own type; a rule rejection is a normal outcome,
      // not a server fault, and must read as one to the player.
      if (err instanceof RuleError) {
        return ack({ ok: false, error: { code: err.code, message: err.message } });
      }
      console.error("[socket]", err);
      return ack({ ok: false, error: INTERNAL });
    },
  );
}

function validName(raw: unknown): string {
  const name = normaliseName(String(raw ?? ""));
  if (name.length < 1) {
    throw new RoomError({ code: "BAD_NAME", message: "Type a name first." });
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new RoomError({
      code: "BAD_NAME",
      message: `Keep it under ${MAX_NAME_LENGTH} characters.`,
    });
  }
  return name;
}

function validDevice(raw: unknown): string {
  if (!isDeviceId(raw)) {
    throw new RoomError({
      code: "BAD_DEVICE",
      message: "Your device id is unreadable. Reload to get a new one.",
    });
  }
  return raw;
}

function validCode(raw: unknown): string {
  const code = normaliseCode(String(raw ?? ""));
  if (!isRoomCode(code)) {
    throw new RoomError({ code: "BAD_CODE", message: "That is not a room code." });
  }
  return code;
}

io.on("connection", (socket: Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>) => {
  const enter = async (code: string, playerId: string) => {
    socket.data.code = code;
    socket.data.playerId = playerId;
    await socket.join(code);
    await broadcastState(code);
  };

  socket.on("room:create", ({ deviceId, name }, ack) =>
    handle(ack, async () => {
      const res = await createRoom(validDevice(deviceId), validName(name));
      await enter(res.code, res.playerId);
      return res;
    }),
  );

  socket.on("room:join", ({ deviceId, name, code }, ack) =>
    handle(ack, async () => {
      const res = await joinRoom(validCode(code), validDevice(deviceId), validName(name));
      await enter(res.code, res.playerId);
      return res;
    }),
  );

  socket.on("room:resume", ({ deviceId, code }, ack) =>
    handle(ack, async () => {
      const res = await resumeRoom(validCode(code), validDevice(deviceId));
      await enter(res.code, res.playerId);
      return res;
    }),
  );

  socket.on("room:leave", (_p, ack) =>
    handle(ack, async () => {
      const { playerId, code } = socket.data;
      if (!playerId || !code) {
        throw new RoomError({ code: "NOT_IN_ROOM", message: "You are not in a room." });
      }
      await leaveRoom(playerId);
      socket.data.playerId = undefined;
      socket.data.code = undefined;
      await socket.leave(code);
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("room:kick", ({ playerId: target }, ack) =>
    handle(ack, async () => {
      const { playerId } = socket.data;
      if (!playerId) {
        throw new RoomError({ code: "NOT_IN_ROOM", message: "You are not in a room." });
      }
      const code = await kickPlayer(playerId, String(target));
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  /** Every game action is the same shape: locate the seat, transition, broadcast. */
  const seat = () => {
    const { playerId, code } = socket.data;
    if (!playerId || !code) {
      throw new RoomError({ code: "NOT_IN_ROOM", message: "You are not in a room." });
    }
    return { playerId, code };
  };

  socket.on("room:clueSeconds", ({ seconds }, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      const n = Number(seconds);
      if (!CLUE_SECONDS_OPTIONS.includes(n as (typeof CLUE_SECONDS_OPTIONS)[number])) {
        throw new RoomError({ code: "BAD_SETTING", message: "Not a timer option." });
      }
      const { rows } = await pool.query<{ host_player_id: string | null }>(
        `select host_player_id from gp.rooms where code = $1`,
        [code],
      );
      if (rows[0]?.host_player_id !== playerId) {
        throw new RoomError({ code: "NOT_HOST", message: "Only the host sets the timer." });
      }
      await pool.query(`update gp.rooms set clue_seconds = $2 where code = $1`, [code, n]);
      // Applies to the round already running, not just the next one.
      await transition(code, (st) => setClueSeconds(st, n)).catch(() => undefined);
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("round:start", (_p, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      await startRound(code, playerId);
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("round:abort", (_p, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      const { rows } = await pool.query<{ host_player_id: string | null }>(
        `select host_player_id from gp.rooms where code = $1`,
        [code],
      );
      if (rows[0]?.host_player_id !== playerId) {
        throw new RoomError({ code: "NOT_HOST", message: "Only the host can abort." });
      }
      await transition(code, abortRound);
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("clue:submit", ({ word }, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      await transition(code, (s) => submitClue(s, playerId, String(word ?? "")));
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("vote:call", (_p, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      await transition(code, (s) => callVote(s, playerId));
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("vote:cast", ({ targetId }, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      const next = await transition(code, (s) => castVote(s, playerId, String(targetId)));
      // The vote can resolve straight to the reveal when nobody is caught.
      if (next.outcome) await applyScores(code, scoreRound(next));
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("escape:guess", ({ cellIndex }, ack) =>
    handle(ack, async () => {
      const { playerId, code } = seat();
      const next = await transition(code, (s) =>
        submitEscape(s, playerId, Number(cellIndex)),
      );
      if (next.outcome) await applyScores(code, scoreRound(next));
      await broadcastState(code);
      return { ok: true as const };
    }),
  );

  socket.on("disconnect", async () => {
    const { playerId, code } = socket.data;
    if (!playerId || !code) return;
    // Presence only. The seat, the name and (later) the secret word all stay.
    await setConnected(playerId, false).catch(() => {});
    await broadcastState(code).catch(() => {});
  });
});

/**
 * Deadlines are enforced here rather than by a per-room setTimeout.
 *
 * A timer in memory dies with a redeploy and takes the round with it; the
 * deadline lives in the round state, so a sweep finds anything overdue whatever
 * happened in between. Two seconds is well inside what anyone notices.
 */
const SWEEP_INTERVAL_MS = 2000;
setInterval(() => {
  void (async () => {
    for (const code of await expiredRooms()) {
      try {
        // Only clues expire. A stalled vote is ended by the host, not a clock.
        await transition(code, (st) => (st.phase === "clues" ? expireClues(st) : st));
        await broadcastState(code);
      } catch (err) {
        console.error("[sweep]", code, err);
      }
    }
  })();
}, SWEEP_INTERVAL_MS).unref();

const REAP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  reapExpiredRooms()
    .then((n) => n && console.log(`[reaper] removed ${n} expired room(s)`))
    .catch((e) => console.error("[reaper]", e));
}, REAP_INTERVAL_MS).unref();

server.listen(env.port, () => {
  console.log(`[gamespaglu-server] listening on ${env.port}`);
});
