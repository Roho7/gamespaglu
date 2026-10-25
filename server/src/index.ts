import http from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server, type Socket } from "socket.io";
import { env } from "./env";
import { ping, pool } from "./db";
import { GameError } from "./game/errors";
import { PgRoomStore } from "./game/pg-store";
import { createGames } from "./game/registry";
import type { RoomRecord } from "./game/room";
import { RoomService } from "./game/service";
import { GRIDS } from "./girgit/grids";
import type {
  Ack,
  ClientToServer,
  Done,
  Err,
  RoomCode,
  ServerToClient,
} from "../../shared/protocol";

const SWEEP_INTERVAL_MS = 2000;
const REAP_INTERVAL_MS = 10 * 60 * 1000;
const INTERNAL: Err = { code: "INTERNAL", message: "Something broke on our side." };
const DONE: Done = { ok: true };

const rooms = new RoomService({
  store: new PgRoomStore(pool),
  games: createGames(GRIDS),
  rng: Math.random,
  now: Date.now,
  newId: randomUUID,
});

const app = express();
app.use(helmet());
app.use(cors({ origin: env.allowedOrigins }));

app.get("/health", async (_req, res) => {
  try {
    await ping();
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

const server = http.createServer(app);

type SocketData = { playerId?: string; code?: string };
type GameSocket = Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>;

const io = new Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>(server, {
  cors: { origin: env.allowedOrigins },
  pingTimeout: 30_000,
});

/** Per socket, because every recipient's view differs by `you` and the private half of the round. */
async function broadcast(code: RoomCode, room: RoomRecord | null) {
  const sockets = await io.in(code).fetchSockets();
  for (const s of sockets) {
    if (!room) {
      s.emit("room:closed", { code: "ROOM_NOT_FOUND", message: "That room is gone." });
      continue;
    }
    const you = s.data.playerId;
    if (you && room.players.some((p) => p.id === you)) s.emit("room:state", rooms.view(room, you));
    else s.emit("room:closed", { code: "NOT_IN_ROOM", message: "You are no longer in that room." });
  }
}

/** Every handler answers through its ack, so nothing rejects into the void. */
function handle<T>(ack: Ack<T>, fn: () => Promise<T>) {
  return fn().then(
    (data) => ack({ ok: true, data }),
    (err) => {
      if (err instanceof GameError) return ack({ ok: false, error: err.err });
      console.error("[socket]", err);
      return ack({ ok: false, error: INTERNAL });
    },
  );
}

io.on("connection", (socket: GameSocket) => {
  const enter = async ({ room, playerId }: { room: RoomRecord; playerId: string }) => {
    socket.data.code = room.code;
    socket.data.playerId = playerId;
    await socket.join(room.code);
    await broadcast(room.code, room);
    return { code: room.code, playerId };
  };

  const seat = () => {
    const { playerId, code } = socket.data;
    if (!playerId || !code) throw new GameError("NOT_IN_ROOM", "You are not in a room.");
    return { playerId, code };
  };

  const inRoom = (fn: (code: RoomCode, playerId: string) => Promise<RoomRecord | null>) => async () => {
    const { code, playerId } = seat();
    await broadcast(code, await fn(code, playerId));
    return DONE;
  };

  socket.on("room:create", ({ deviceId, name, game, settings }, ack) =>
    handle(ack, async () => enter(await rooms.create(game, deviceId, name, settings))),
  );

  socket.on("room:join", ({ deviceId, name, code, game }, ack) =>
    handle(ack, async () => enter(await rooms.join(code, game, deviceId, name))),
  );

  socket.on("room:resume", ({ deviceId, code }, ack) =>
    handle(ack, async () => enter(await rooms.resume(code, deviceId))),
  );

  socket.on("room:leave", (_p, ack) =>
    handle(ack, async () => {
      const { code, playerId } = seat();
      const room = await rooms.leave(code, playerId);
      socket.data.code = undefined;
      socket.data.playerId = undefined;
      await socket.leave(code);
      await broadcast(code, room);
      return DONE;
    }),
  );

  socket.on("room:kick", ({ playerId: target }, ack) =>
    handle(ack, inRoom((code, playerId) => rooms.kick(code, playerId, target))),
  );

  socket.on("room:settings", ({ settings }, ack) =>
    handle(ack, inRoom((code, playerId) => rooms.configure(code, playerId, settings))),
  );

  socket.on("round:start", (_p, ack) =>
    handle(ack, inRoom((code, playerId) => rooms.start(code, playerId))),
  );

  socket.on("round:abort", (_p, ack) =>
    handle(ack, inRoom((code, playerId) => rooms.abort(code, playerId))),
  );

  socket.on("game:act", ({ action }, ack) =>
    handle(ack, inRoom((code, playerId) => rooms.act(code, playerId, action))),
  );

  socket.on("disconnect", async () => {
    const { playerId, code } = socket.data;
    if (!playerId || !code) return;
    try {
      await broadcast(code, await rooms.setConnected(code, playerId, false));
    } catch (err) {
      if (!(err instanceof GameError)) console.error("[disconnect]", err);
    }
  });
});

/**
 * Deadlines live in round state, not in a per-room setTimeout, so a redeploy cannot lose one: the
 * sweep finds anything overdue whatever happened in between.
 */
setInterval(() => {
  void rooms
    .sweep((code, err) => console.error("[sweep]", code, err))
    .then((changed) => Promise.all(changed.map((room) => broadcast(room.code, room))))
    .catch((err) => console.error("[sweep]", err));
}, SWEEP_INTERVAL_MS).unref();

setInterval(() => {
  rooms
    .reap()
    .then((n) => n && console.log(`[reaper] removed ${n} expired room(s)`))
    .catch((err) => console.error("[reaper]", err));
}, REAP_INTERVAL_MS).unref();

server.listen(env.port, () => {
  console.log(`[gamespaglu-server] listening on ${env.port}`);
});
