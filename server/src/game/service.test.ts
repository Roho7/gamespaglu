import { beforeEach, describe, expect, test } from "vitest";
import {
  NO_ONE,
  ROOM_TTL_MS,
  type GameId,
  type MafiaRole,
  type RoomStateOf,
} from "../../../shared/protocol";
import type { Grid, RoundState } from "../girgit/engine";
import type { MafiaState } from "../mafia/engine";
import { expectRefusalAsync, seeded } from "../test/helpers";
import { MemoryRoomStore } from "./memory-store";
import { createGames } from "./registry";
import type { RoomRecord } from "./room";
import { RoomService } from "./service";

const GRIDS: Grid[] = ["g1", "g2", "g3"].map((id) => ({
  id,
  theme: id,
  pack: "everyday",
  cells: Array.from({ length: 16 }, (_, i) => `${id}-cell${i}`),
}));

const device = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

let t: number;
let store: MemoryRoomStore;
let rooms: RoomService;

beforeEach(() => {
  t = 1_000_000;
  store = new MemoryRoomStore();
  let id = 0;
  rooms = new RoomService({
    store,
    games: createGames(GRIDS),
    rng: seeded(42),
    now: () => t,
    newId: () => `p${++id}`,
  });
});

async function table(game: GameId, size: number) {
  const host = await rooms.create(game, device(0), "Host");
  const ids = [host.playerId];
  for (let i = 1; i < size; i++) {
    ids.push((await rooms.join(host.room.code, game, device(i), `Player ${i}`)).playerId);
  }
  return { code: host.room.code, host: host.playerId, ids };
}

const stored = (code: string): RoomRecord => store.peek(code)!;
const mafiaState = (code: string) => stored(code).round!.state as MafiaState;
const girgitState = (code: string) => stored(code).round!.state as RoundState;
const viewOf = <G extends GameId>(room: RoomRecord | null, you: string) =>
  rooms.view(room!, you) as RoomStateOf<G>;

describe("creating and joining", () => {
  test("seats the host and starts in the lobby with the game's defaults", async () => {
    const { room, playerId } = await rooms.create("girgit", device(0), "  Asha  ");
    const view = viewOf<"girgit">(room, playerId);
    expect(view).toMatchObject({
      game: "girgit",
      phase: "lobby",
      hostId: playerId,
      minPlayers: 4,
      maxPlayers: 10,
      settings: { clueSeconds: 60 },
      round: null,
      your: null,
    });
    expect(view.players).toEqual([
      { id: playerId, name: "Asha", seat: 0, connected: true, isHost: true, score: 0 },
    ]);
    expect(room.code).toMatch(/^[BCDFGHJKLMNPQRSTVWXYZ]{4}$/);
  });

  test("applies settings given at creation", async () => {
    const { room } = await rooms.create("girgit", device(0), "Asha", { clueSeconds: 30, packs: ["everyday"] });
    expect(room.settings).toEqual({ clueSeconds: 30, packs: ["everyday"] });
  });

  test("refuses a bad game, device, name or setting", async () => {
    await expectRefusalAsync("BAD_GAME", () => rooms.create("chess", device(0), "Asha"));
    await expectRefusalAsync("BAD_DEVICE", () => rooms.create("mafia", "not-a-uuid", "Asha"));
    await expectRefusalAsync("BAD_NAME", () => rooms.create("mafia", device(0), "   "));
    await expectRefusalAsync("BAD_SETTING", () =>
      rooms.create("girgit", device(0), "Asha", { clueSeconds: 45 }),
    );
  });

  test("seats joiners in the lowest free seat", async () => {
    const { code, ids } = await table("mafia", 3);
    await rooms.leave(code, ids[1]);
    const back = await rooms.join(code, "mafia", device(9), "Late");
    expect(back.room.players.find((p) => p.id === back.playerId)?.seat).toBe(1);
  });

  test("a device that already has a seat gets it back, renamed", async () => {
    const { code, ids } = await table("mafia", 2);
    const again = await rooms.join(code, "mafia", device(1), "Renamed");
    expect(again.playerId).toBe(ids[1]);
    expect(again.room.players).toHaveLength(2);
    expect(again.room.players[1].name).toBe("Renamed");
  });

  test("refuses a taken name, a full room, the wrong game and an unknown code", async () => {
    const { code } = await table("mafia", 12);
    await expectRefusalAsync("ROOM_FULL", () => rooms.join(code, "mafia", device(20), "One more"));
    const small = await rooms.create("mafia", device(30), "Host");
    await expectRefusalAsync("NAME_TAKEN", () => rooms.join(small.room.code, "mafia", device(31), "host"));
    await expectRefusalAsync("WRONG_GAME", () => rooms.join(small.room.code, "girgit", device(32), "Asha"));
    await expectRefusalAsync("BAD_CODE", () => rooms.join("AEIO", "mafia", device(33), "Asha"));
    const missing = small.room.code === "BBBB" ? "CCCC" : "BBBB";
    await expectRefusalAsync("ROOM_NOT_FOUND", () => rooms.join(missing, "mafia", device(34), "Asha"));
  });

  test("resume restores a seat but never creates one", async () => {
    const { code, ids } = await table("mafia", 2);
    await rooms.setConnected(code, ids[1], false);
    const back = await rooms.resume(code, device(1));
    expect(back.playerId).toBe(ids[1]);
    expect(back.room.players[1].connected).toBe(true);
    await expectRefusalAsync("NOT_IN_ROOM", () => rooms.resume(code, device(99)));
  });

  test("a room nobody has touched in the TTL is gone", async () => {
    const { code } = await table("mafia", 1);
    t += ROOM_TTL_MS + 1;
    await expectRefusalAsync("ROOM_NOT_FOUND", () => rooms.resume(code, device(0)));
    expect(store.peek(code)).toBeNull();
  });
});

describe("hosting", () => {
  test("only the host deals, configures, aborts and kicks", async () => {
    const { code, ids } = await table("girgit", 4);
    await expectRefusalAsync("NOT_HOST", () => rooms.start(code, ids[1]));
    await expectRefusalAsync("NOT_HOST", () => rooms.configure(code, ids[1], { clueSeconds: 30 }));
    await expectRefusalAsync("NOT_HOST", () => rooms.kick(code, ids[1], ids[2]));
    await rooms.start(code, ids[0]);
    await expectRefusalAsync("NOT_HOST", () => rooms.abort(code, ids[1]));
  });

  test("passes to the longest-seated connected player when the host leaves", async () => {
    const { code, ids } = await table("mafia", 3);
    await rooms.setConnected(code, ids[1], false);
    const room = await rooms.leave(code, ids[0]);
    expect(room?.hostId).toBe(ids[2]);
  });

  test("an emptied room is deleted", async () => {
    const { code, ids } = await table("mafia", 1);
    expect(await rooms.leave(code, ids[0])).toBeNull();
    expect(store.peek(code)).toBeNull();
  });
});

describe("dealing", () => {
  test("needs the game's minimum, and cannot redeal a live round", async () => {
    const { code, ids } = await table("mafia", 4);
    await expectRefusalAsync("NOT_ENOUGH_PLAYERS", () => rooms.start(code, ids[0]));
    await rooms.join(code, "mafia", device(5), "Fifth");
    const room = await rooms.start(code, ids[0]);
    expect(viewOf<"mafia">(room, ids[0]).phase).toBe("night");
    await expectRefusalAsync("WRONG_PHASE", () => rooms.start(code, ids[0]));
  });

  test("a player seated after the deal watches without a private view", async () => {
    const { code, ids } = await table("mafia", 5);
    await rooms.start(code, ids[0]);
    const late = await rooms.join(code, "mafia", device(9), "Late");
    const view = viewOf<"mafia">(late.room, late.playerId);
    expect(view.your).toBeNull();
    expect(view.round?.roster.map((p) => p.id)).toEqual(ids);
  });

  test("rejects untrusted moves before the game sees them", async () => {
    const { code, ids } = await table("mafia", 5);
    await rooms.start(code, ids[0]);
    await expectRefusalAsync("BAD_ACTION", () => rooms.act(code, ids[1], { type: "steal" }));
    await expectRefusalAsync("BAD_ACTION", () => rooms.act(code, ids[1], null));
    await expectRefusalAsync("NOT_IN_ROOM", () => rooms.act(code, "stranger", { type: "vote:call" }));
  });
});

describe("Mafia through the room", () => {
  async function dealt() {
    const seatedTable = await table("mafia", 5);
    await rooms.start(seatedTable.code, seatedTable.host);
    const roles = mafiaState(seatedTable.code).roles;
    const who = (role: MafiaRole) => seatedTable.ids.filter((id) => roles[id] === role);
    return { ...seatedTable, who };
  }

  test("plays a whole game and scores the winners exactly once", async () => {
    const { code, ids, host, who } = await dealt();
    const [mafia] = who("mafia");
    const [doctor] = who("doctor");
    
    const [v1, v2, v3] = who("villager");

    await rooms.act(code, mafia, { type: "night:pick", targetId: v1 });
    await rooms.act(code, doctor, { type: "night:pick", targetId: v2 });
    await rooms.act(code, v1, { type: "night:pick", targetId: mafia });
    await rooms.act(code, v3, { type: "night:pick", targetId: mafia });
    let room = await rooms.act(code, v2, { type: "night:pick", targetId: mafia });
    expect(viewOf<"mafia">(room, host).round?.news).toEqual({ night: 1, died: v1 });

    await rooms.act(code, doctor, { type: "vote:call" });
    for (const voter of [doctor, v2, v3]) {
      room = await rooms.act(code, voter, { type: "vote:cast", targetId: mafia });
    }
    room = await rooms.act(code, mafia, { type: "vote:cast", targetId: NO_ONE });

    const view = viewOf<"mafia">(room, host);
    expect(view.phase).toBe("over");
    expect(view.round?.outcome).toBe("town");
    const score = Object.fromEntries(view.players.map((p) => [p.id, p.score]));
    expect(score).toEqual(Object.fromEntries(ids.map((id) => [id, id === mafia ? 0 : 1])));

    await expectRefusalAsync("WRONG_PHASE", () => rooms.act(code, doctor, { type: "night:fall" }));
    expect(stored(code).players.map((p) => p.score)).toEqual(view.players.map((p) => p.score));
  });

  test("a kicked player goes out with their role revealed, and can end the game", async () => {
    const { code, host, who } = await dealt();
    const [villager] = who("villager");
    let room = await rooms.kick(code, host, villager);
    let round = viewOf<"mafia">(room, host).round;
    expect(round?.roster.find((p) => p.id === villager)).toMatchObject({ alive: false, role: "villager", fate: "left" });
    expect(room?.players.some((p) => p.id === villager)).toBe(false);

    const [mafia] = who("mafia");
    room = await rooms.leave(code, mafia);
    round = viewOf<"mafia">(room, room!.players[0].id).round;
    expect(round?.outcome).toBe("town");
    expect(room?.players.every((p) => p.score === 1)).toBe(true);
  });

  test("abort ends the game with no score and allows a new deal", async () => {
    const { code, host } = await dealt();
    const room = await rooms.abort(code, host);
    expect(viewOf<"mafia">(room, host).round?.outcome).toBe("aborted");
    expect(room?.players.every((p) => p.score === 0)).toBe(true);
    const again = await rooms.start(code, host);
    expect(again?.round?.no).toBe(2);
  });

  test("the host's flag reaches the game, so only the host ends the night", async () => {
    const { code, host, ids } = await dealt();
    const guest = ids.find((id) => id !== host)!;
    await expectRefusalAsync("NOT_HOST", () => rooms.act(code, guest, { type: "night:end" }));
    const room = await rooms.act(code, host, { type: "night:end" });
    expect(viewOf<"mafia">(room, host).phase).toBe("day");
  });

  test("simultaneous last moves resolve the night once", async () => {
    const { code, who } = await dealt();
    const [mafia] = who("mafia");
    const [doctor] = who("doctor");
    
    const [v1, v2, v3] = who("villager");
    await rooms.act(code, mafia, { type: "night:pick", targetId: v1 });
    await rooms.act(code, doctor, { type: "night:pick", targetId: doctor });
    await rooms.act(code, v3, { type: "night:pick", targetId: v1 });
    await Promise.all([
      rooms.act(code, v1, { type: "night:pick", targetId: v2 }),
      rooms.act(code, v2, { type: "night:pick", targetId: v1 }),
    ]);
    const state = mafiaState(code);
    expect(state.phase).toBe("day");
    expect(state.records.filter((r) => r.kind === "night")).toHaveLength(1);
  });
});

describe("Girgit through the room", () => {
  test("never deals the same grid twice in a session", async () => {
    const { code, host } = await table("girgit", 4);
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      await rooms.start(code, host);
      seen.push(girgitState(code).gridId);
      await rooms.abort(code, host);
    }
    expect(new Set(seen).size).toBe(3);
  });

  test("a settings change reaches the running clue phase", async () => {
    const { code, host } = await table("girgit", 4);
    await rooms.start(code, host);
    const opened = girgitState(code).cluesStartedAt;
    await rooms.configure(code, host, { clueSeconds: 30 });
    expect(girgitState(code).deadlineAt).toBe(opened + 30_000);
    expect(stored(code).settings).toEqual({ clueSeconds: 30, packs: expect.any(Array) });
  });

  test("the sweep times out an overdue clue phase and nothing else", async () => {
    const { code, host } = await table("girgit", 4);
    await rooms.start(code, host);
    expect(await rooms.sweep(() => undefined)).toEqual([]);
    t += 61_000;
    const changed = await rooms.sweep(() => undefined);
    expect(changed.map((r) => r.code)).toEqual([code]);
    expect(girgitState(code).phase).toBe("discuss");
    expect(await rooms.sweep(() => undefined)).toEqual([]);
  });

  test("scores a round once it reaches the reveal", async () => {
    const { code, host, ids } = await table("girgit", 4);
    await rooms.start(code, host);
    for (const id of ids) {
      await rooms.act(code, id, { type: "clue:submit", word: `clue${id}` });
    }
    await rooms.act(code, ids[0], { type: "vote:call" });
    const girgit = girgitState(code).girgit;
    const innocent = ids.find((id) => id !== girgit)!;
    let room: RoomRecord | null = null;
    for (const id of ids) {
      room = await rooms.act(code, id, { type: "vote:cast", targetId: id === innocent ? girgit : innocent });
    }
    expect(viewOf<"girgit">(room, host).round?.outcome).toBe("girgit-escaped");
    expect(room?.players.find((p) => p.id === girgit)?.score).toBe(2);
  });
});
