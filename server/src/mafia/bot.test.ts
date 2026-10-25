import { describe, expect, test } from "vitest";
import { NO_ONE, type MafiaRole, type PlayerId } from "../../../shared/protocol";
import type { RoomRecord } from "../game/room";
import { seats, seeded } from "../test/helpers";
import { mafiaBrain } from "./bot";
import { castVote, callVote, dealMafia, pickAtNight, type MafiaState } from "./engine";
import { mafiaModule } from "./module";

const ROLES: Record<PlayerId, MafiaRole> = {
  you: "villager",
  m1: "mafia",
  m2: "mafia",
  doc: "doctor",
  det: "detective",
  v1: "villager",
  v2: "villager",
};

const roomOf = (state: MafiaState): RoomRecord => ({
  code: "BCDF",
  game: "mafia",
  hostId: "you",
  settings: {},
  players: state.players.map((id, seat) => ({ id, deviceId: id, name: id, seat, connected: true, score: 0 })),
  round: { no: 1, state },
  lastActiveAt: 0,
});

const fresh = (): MafiaState => ({ ...dealMafia(seats(Object.keys(ROLES)), seeded(1)), roles: { ...ROLES } });

const move = (s: MafiaState, bot: PlayerId, you = "you", seed = 3) =>
  mafiaBrain(roomOf(s), bot, you, seeded(seed));

describe("mafiaBrain", () => {
  test("Mafia bots never pick their own and fall in behind the first pick", () => {
    const s = pickAtNight(fresh(), "m1", "v1");
    expect(move(s, "m2")?.action).toEqual({ type: "night:pick", targetId: "v1" });
    for (let seed = 1; seed < 20; seed++) {
      const first = move(fresh(), "m1", "you", seed)?.action as { targetId: PlayerId };
      expect(ROLES[first.targetId]).not.toBe("mafia");
    }
  });

  test("a Mafia bot follows you when you are Mafia", () => {
    const youMafia = { ...fresh(), roles: { ...ROLES, you: "mafia" as const, m2: "villager" as const } };
    const s = pickAtNight(pickAtNight(youMafia, "m1", "v1"), "you", "v2");
    expect(move(s, "m1")?.action).toEqual({ type: "night:pick", targetId: "v2" });
  });

  test("the Doctor bot never repeats last night's save", () => {
    for (let seed = 1; seed < 20; seed++) {
      const s = { ...fresh(), lastSave: "v1" };
      expect((move(s, "doc", "you", seed)?.action as { targetId: PlayerId }).targetId).not.toBe("v1");
    }
  });

  test("bots wait for you to call the vote and to vote first", () => {
    const day = { ...fresh(), phase: "day" as const };
    expect(move(day, "v1")).toBeNull();
    const vote = callVote(day, "you");
    expect(move(vote, "v1")).toBeNull();
    expect(move(castVote(vote, "you", NO_ONE), "v1")?.action).toMatchObject({ type: "vote:cast" });
  });

  test("once you are out, the first living bot keeps the game moving", () => {
    const out: MafiaState = { ...fresh(), phase: "day", fates: { you: "killed" } };
    expect(move(out, "m1")?.action).toEqual({ type: "vote:call" });
    expect(move(out, "v1")).toBeNull();
  });

  test("a table of bots plays a game to the end", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const rng = seeded(seed);
      let s: MafiaState = { ...dealMafia(seats(Object.keys(ROLES)), rng), fates: { you: "left" } };
      for (let steps = 0; s.phase !== "over"; steps++) {
        expect(steps).toBeLessThan(500);
        const moves = s.players
          .map((bot) => ({ bot, move: mafiaBrain(roomOf(s), bot, "you", rng) }))
          .filter((m) => m.move);
        expect(moves.length).toBeGreaterThan(0);
        const { bot, move: next } = moves[Math.floor(rng() * moves.length)];
        s = mafiaModule.act(s, bot, mafiaModule.parseAction(next!.action), {
          isHost: false,
          rng,
          now: () => 0,
        });
      }
      expect(["town", "mafia"]).toContain(s.outcome);
    }
  });
});
