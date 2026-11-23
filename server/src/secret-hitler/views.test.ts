import { beforeEach, describe, expect, test } from "vitest";
import type { RoomStateOf, ShAction } from "../../../shared/protocol";
import { MemoryRoomStore } from "../game/memory-store";
import { createGames } from "../game/registry";
import type { RoomRecord } from "../game/room";
import { RoomService } from "../game/service";
import { seeded } from "../test/helpers";
import { eligibleChancellors, nightKnowledge, type ShState } from "./engine";

const device = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

let store: MemoryRoomStore;
let rooms: RoomService;
let code: string;
let ids: string[];

beforeEach(async () => {
  store = new MemoryRoomStore();
  let id = 0;
  rooms = new RoomService({ store, games: createGames([]), rng: seeded(3), now: () => 1_000, newId: () => `p${++id}` });
  const host = await rooms.create("secret-hitler", device(0), "Host");
  code = host.room.code;
  ids = [host.playerId];
  for (let i = 1; i < 7; i++) ids.push((await rooms.join(code, "secret-hitler", device(i), `P${i}`)).playerId);
  await rooms.start(code, host.playerId);
});

const room = (): RoomRecord => store.peek(code)!;
const state = () => room().round!.state as ShState;
const payload = (you: string) => rooms.view(room(), you) as RoomStateOf<"secret-hitler">;
const act = (by: string, action: ShAction) => rooms.act(code, by, action);

async function playAndCapture() {
  const snapshots: RoomStateOf<"secret-hitler">[][] = [];
  const moments: { nominated: RoomStateOf<"secret-hitler">; midVote: RoomStateOf<"secret-hitler">[]; cast: Record<string, boolean> }[] = [];
  const snap = () => snapshots.push(ids.map(payload));
  snap();
  for (let round = 0; round < 8 && state().phase !== "over"; round++) {
    const s = state();
    if (s.phase === "power") {
      const target = s.players.find((p) => p !== s.president && !s.dead.includes(p) && s.roles[p] !== "hitler")!;
      const action: ShAction =
        s.power === "peek" ? { type: "peek:done" } : { type: s.power!, targetId: target };
      await act(s.president, action);
      snap();
      continue;
    }
    await act(s.president, { type: "nominate", targetId: eligibleChancellors(s)[0] });
    snap();
    const nominated = payload(ids[0]);
    const voters = s.players.filter((p) => !s.dead.includes(p));
    const cast: Record<string, boolean> = {};
    for (const [i, voter] of voters.entries()) {
      cast[voter] = round % 3 !== 1;
      await act(voter, { type: "vote", ja: cast[voter] });
      if (i === 2) {
        snap();
        moments.push({ nominated, midVote: ids.map(payload), cast: { ...cast } });
      }
    }
    snap();
    if (state().phase !== "president") continue;
    await act(state().president, { type: "discard", index: 0 });
    snap();
    await act(state().chancellor!, { type: "enact", index: 0 });
    snap();
  }
  return Object.assign(snapshots.flat(), { moments });
}

const withoutPrivate = ({ you: _you, your: _your, ...shared }: RoomStateOf<"secret-hitler">) => shared;

describe("what reaches each phone", () => {
  test("every phone gets the identical shared board; only `you` and `your` differ", async () => {
    const all = await playAndCapture();
    for (let i = 0; i < all.length; i += ids.length) {
      const moment = all.slice(i, i + ids.length).map(withoutPrivate);
      for (const view of moment) expect(view).toEqual(moment[0]);
    }
  });

  test("the shared board names no living role, no tile in the deck or a hand, and no sealed ballot", async () => {
    const all = await playAndCapture();
    for (const view of all) {
      const round = view.round!;
      if (round.phase !== "over") expect(round.roster.every((p) => p.role === null)).toBe(true);
      const json = JSON.stringify(round);
      for (const secret of ['"deck"', '"discard"', '"hand"', '"roles"', '"votes"', '"peek"']) {
        expect(json).not.toContain(secret);
      }
    }
  });

  test("a phone's private half holds its own role and only what its night showed it", async () => {
    const all = await playAndCapture();
    const s = state();
    for (const view of all) {
      const your = view.your!;
      expect(your.role).toBe(s.roles[view.you]);
      expect(your.knows.map((k) => k.playerId)).toEqual(nightKnowledge(s, view.you));
      for (const k of your.knows) expect(k.role).toBe(s.roles[k.playerId]);
    }
  });

  test("one player's payload never carries another player's role", async () => {
    const all = await playAndCapture();
    const s = state();
    for (const view of all.filter((v) => v.round!.phase !== "over")) {
      const shown = new Set(nightKnowledge(s, view.you));
      const json = JSON.stringify(view);
      for (const other of ids.filter((p) => p !== view.you && !shown.has(p))) {
        expect(json).not.toContain(`"playerId":"${other}","role"`);
        expect(json).not.toContain(`"id":"${other}","name":"${s.names[other]}","alive":true,"role":"`);
      }
    }
  });

  test("tiles reach only the officer holding them, and peeks and investigations only the President", async () => {
    const all = await playAndCapture();
    for (const view of all) {
      const round = view.round!;
      const your = view.your!;
      const holder =
        round.phase === "president" ? round.president : round.phase === "chancellor" ? round.chancellor : null;
      if (view.you === holder) expect(your.hand?.length).toBe(round.phase === "president" ? 3 : 2);
      else expect(your.hand).toBeNull();
      if (your.peek) expect(view.you).toBe(round.president);
      for (const i of your.investigations) expect(i.party).toMatch(/^(liberal|fascist)$/);
    }
  });

  test("a vote stays sealed: mid-vote, each phone sees only its own ballot and the last result", async () => {
    const { moments } = await playAndCapture();
    expect(moments.length).toBeGreaterThan(1);
    for (const { nominated, midVote, cast } of moments) {
      for (const view of midVote) {
        expect(view.round!.phase).toBe("vote");
        expect(view.round!.lastVote).toEqual(nominated.round!.lastVote);
        expect(view.your!.vote).toBe(cast[view.you] ?? null);
        expect(view.round!.roster.filter((p) => p.voted).map((p) => p.id).sort()).toEqual(Object.keys(cast).sort());
      }
    }
  });

  test("reopening the page on the same device restores the same seat and secrets", async () => {
    const before = payload(ids[3]);
    await rooms.setConnected(code, ids[3], false);
    const back = await rooms.resume(code, device(3));
    expect(back.playerId).toBe(ids[3]);
    expect(payload(ids[3]).your).toEqual(before.your);
  });
});
