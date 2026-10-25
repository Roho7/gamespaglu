import { describe, expect, test } from "vitest";
import { NO_ONE, roleMix, type MafiaRole, type PlayerId } from "../../../shared/protocol";
import { expectRefusal, seats, seeded } from "../test/helpers";
import {
  abortGame,
  agreedKill,
  callVote,
  castVote,
  closeVote,
  dealMafia,
  endNight,
  fallNight,
  living,
  nightOutstanding,
  pickAtNight,
  removePlayer,
  scoreGame,
  voteOutstanding,
  winner,
  type MafiaState,
} from "./engine";

const FIVE: Record<PlayerId, MafiaRole> = {
  m1: "mafia",
  doc: "doctor",
  det: "detective",
  v1: "villager",
  v2: "villager",
};

const SEVEN: Record<PlayerId, MafiaRole> = {
  m1: "mafia",
  m2: "mafia",
  doc: "doctor",
  det: "detective",
  v1: "villager",
  v2: "villager",
  v3: "villager",
};

function game(roles: Record<PlayerId, MafiaRole>): MafiaState {
  return { ...dealMafia(seats(Object.keys(roles)), seeded(1)), roles: { ...roles } };
}

function night(s: MafiaState, picks: Record<PlayerId, PlayerId>): MafiaState {
  for (const [by, target] of Object.entries(picks)) s = pickAtNight(s, by, target);
  return s;
}

function vote(s: MafiaState, ballots: Record<PlayerId, PlayerId>): MafiaState {
  s = callVote(s, living(s)[0]);
  for (const [by, target] of Object.entries(ballots)) s = castVote(s, by, target);
  return s;
}

function skipDay(s: MafiaState): MafiaState {
  return fallNight(closeVote(callVote(s, living(s)[0]), true), living(s)[0]);
}

const quietNight = { m1: "v1", doc: "v1", det: "m1", v1: "v2", v2: "v1" };

describe("roleMix", () => {
  test.each([
    [5, 1, 2],
    [6, 1, 3],
    [7, 2, 3],
    [9, 2, 5],
    [10, 3, 5],
    [12, 3, 7],
  ])("%i players deal %i Mafia and %i villagers", (n, mafia, villager) => {
    expect(roleMix(n)).toEqual({ mafia, doctor: 1, detective: 1, villager });
  });
});

describe("deal", () => {
  test("gives every player exactly one role, in the table's mix", () => {
    for (let n = 5; n <= 12; n++) {
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const s = dealMafia(seats(ids), seeded(n));
      const counts = { mafia: 0, doctor: 0, detective: 0, villager: 0 };
      for (const id of ids) counts[s.roles[id]]++;
      expect(counts).toEqual(roleMix(n));
    }
  });

  test("opens on night one with everybody in", () => {
    const s = dealMafia(seats(Object.keys(FIVE)), seeded(2));
    expect(s).toMatchObject({ phase: "night", night: 1, fates: {}, outcome: null });
    expect(living(s)).toHaveLength(5);
  });

  test("shuffles who gets what", () => {
    const ids = Object.keys(SEVEN);
    const deals = [1, 2, 3, 4, 5].map((seed) => JSON.stringify(dealMafia(seats(ids), seeded(seed)).roles));
    expect(new Set(deals).size).toBeGreaterThan(1);
  });

  test("refuses fewer than five and more than twelve", () => {
    expectRefusal("NOT_ENOUGH_PLAYERS", () => dealMafia(seats(["a", "b", "c", "d"]), seeded(1)));
    const thirteen = Array.from({ length: 13 }, (_, i) => `p${i}`);
    expectRefusal("ROOM_FULL", () => dealMafia(seats(thirteen), seeded(1)));
  });
});

describe("night", () => {
  test("resolves when the last living player picks, and the kill lands", () => {
    let s = night(game(FIVE), { m1: "v1", doc: "v2", det: "v1", v1: "m1" });
    expect(s.phase).toBe("night");
    expect(nightOutstanding(s)).toEqual(["v2"]);
    s = pickAtNight(s, "v2", "doc");
    expect(s.phase).toBe("day");
    expect(s.fates).toEqual({ v1: "killed" });
    expect(s.records).toEqual([
      {
        kind: "night",
        night: 1,
        kill: "v1",
        save: "v2",
        check: "v1",
        died: "v1",
        suspicions: [
          { voterId: "v1", targetId: "m1" },
          { voterId: "v2", targetId: "doc" },
        ],
      },
    ]);
  });

  test("the Doctor's save stops the kill", () => {
    const s = night(game(FIVE), quietNight);
    expect(s.phase).toBe("day");
    expect(s.fates).toEqual({});
    expect(s.records[0]).toMatchObject({ kill: "v1", save: "v1", died: null });
  });

  test("Mafia must agree, and stay outstanding until they do", () => {
    let s = night(game(SEVEN), { m1: "v1", m2: "v2", doc: "doc", det: "m1", v1: "v2", v2: "v3", v3: "v1" });
    expect(s.phase).toBe("night");
    expect(agreedKill(s)).toBeNull();
    expect(nightOutstanding(s)).toEqual(["m1", "m2"]);
    s = pickAtNight(s, "m2", "v1");
    expect(s.phase).toBe("day");
    expect(s.fates).toEqual({ v1: "killed" });
  });

  test("anyone may change their pick until the night resolves", () => {
    let s = pickAtNight(game(FIVE), "v1", "m1");
    s = pickAtNight(s, "v1", "det");
    expect(s.picks.v1).toBe("det");
  });

  test("Mafia cannot target their own", () => {
    expectRefusal("BAD_TARGET", () => pickAtNight(game(SEVEN), "m1", "m2"));
    expectRefusal("BAD_TARGET", () => pickAtNight(game(SEVEN), "m1", "m1"));
  });

  test("the Doctor may save themselves, but never the same player two nights running", () => {
    let s = night(game(SEVEN), { m1: "doc", m2: "doc", doc: "doc", det: "v1", v1: "v2", v2: "v3", v3: "v1" });
    expect(s.fates).toEqual({});
    s = skipDay(s);
    expectRefusal("BAD_TARGET", () => pickAtNight(s, "doc", "doc"));
    s = pickAtNight(s, "doc", "v1");
    expect(s.picks.doc).toBe("v1");
  });

  test("a Doctor who saved nobody may save anyone the next night", () => {
    let s = endNight(night(game(FIVE), { m1: "v1", det: "m1", v1: "v2", v2: "v1" }), true);
    expect(s.lastSave).toBeNull();
    expect(s.fates).toEqual({ v1: "killed" });
    s = pickAtNight(skipDay(s), "doc", "v2");
    expect(s.picks.doc).toBe("v2");
  });

  test("the Detective checks someone else, and learns the truth", () => {
    expectRefusal("BAD_TARGET", () => pickAtNight(game(FIVE), "det", "det"));
    const s = night(game(FIVE), quietNight);
    expect(s.checks).toEqual([{ night: 1, targetId: "m1", isMafia: true }]);
    const other = night(game(FIVE), { ...quietNight, det: "v2" });
    expect(other.checks).toEqual([{ night: 1, targetId: "v2", isMafia: false }]);
  });

  test("a Detective killed that night learns nothing", () => {
    const s = night(game(FIVE), { ...quietNight, m1: "det" });
    expect(s.fates).toEqual({ det: "killed" });
    expect(s.checks).toEqual([]);
  });

  test("Villagers cannot suspect themselves", () => {
    expectRefusal("BAD_TARGET", () => pickAtNight(game(FIVE), "v1", "v1"));
  });

  test("refuses the dead, dead targets, outsiders and the wrong phase", () => {
    const killed = night(game(FIVE), { ...quietNight, doc: "v2" });
    const night2 = skipDay(killed);
    expectRefusal("NOT_PLAYING", () => pickAtNight(night2, "v1", "m1"));
    expectRefusal("BAD_TARGET", () => pickAtNight(night2, "m1", "v1"));
    expectRefusal("NOT_PLAYING", () => pickAtNight(night2, "zzz", "m1"));
    expectRefusal("WRONG_PHASE", () => pickAtNight(killed, "m1", "v2"));
  });

  test("the host can end a stalled night, and missing picks resolve as nothing", () => {
    const stalled = night(game(SEVEN), { m1: "v1", doc: "v2" });
    expectRefusal("NOT_HOST", () => endNight(stalled, false));
    const s = endNight(stalled, true);
    expect(s.phase).toBe("day");
    expect(s.fates).toEqual({});
    expect(s.records[0]).toMatchObject({ kill: null, save: "v2", check: null, died: null });
  });
});

describe("day and vote", () => {
  const day = () => night(game(SEVEN), { m1: "v1", m2: "v1", doc: "v2", det: "m1", v1: "m1", v2: "m1", v3: "m1" });

  test("any living player calls the vote; the dead cannot", () => {
    const s = day();
    expectRefusal("NOT_PLAYING", () => callVote(s, "v1"));
    expect(callVote(s, "v3").phase).toBe("vote");
    expectRefusal("WRONG_PHASE", () => callVote(game(FIVE), "v1"));
  });

  test("ballots are one each, for a living player or No one, never yourself", () => {
    const s = callVote(day(), "v2");
    expectRefusal("SELF_VOTE", () => castVote(s, "v2", "v2"));
    expectRefusal("BAD_TARGET", () => castVote(s, "v2", "v1"));
    expectRefusal("NOT_PLAYING", () => castVote(s, "v1", "m1"));
    const once = castVote(s, "v2", NO_ONE);
    expectRefusal("ALREADY_DONE", () => castVote(once, "v2", "m1"));
  });

  test("the single leader goes out and the verdict waits for the table", () => {
    const s = vote(day(), { m1: "v2", m2: "v2", doc: "m1", det: "m1", v2: "m1", v3: "m1" });
    expect(s.phase).toBe("verdict");
    expect(s.fates.m1).toBe("voted");
    expect(s.records.at(-1)).toMatchObject({ kind: "vote", day: 1, out: "m1" });
    expect(voteOutstanding(s)).toHaveLength(5);
  });

  test("a tie sends nobody out", () => {
    const s = vote(day(), { m1: "v2", m2: "v2", doc: "m1", det: "m1", v2: "v3", v3: "doc" });
    expect(s.phase).toBe("verdict");
    expect(s.records.at(-1)).toMatchObject({ out: null });
    expect(living(s)).toHaveLength(6);
  });

  test("No one winning sends nobody out", () => {
    const s = vote(day(), { m1: NO_ONE, m2: NO_ONE, doc: NO_ONE, det: "m1", v2: "m1", v3: NO_ONE });
    expect(s.records.at(-1)).toMatchObject({ out: null });
  });

  test("the host can close a stalled vote, counting only the ballots in", () => {
    const s = vote(day(), { doc: "m2", det: "m2" });
    expect(s.phase).toBe("vote");
    expectRefusal("NOT_HOST", () => closeVote(s, false));
    const closed = closeVote(s, true);
    expect(closed.fates.m2).toBe("voted");
    expect(closed.records.at(-1)).toMatchObject({
      ballots: [
        { voterId: "doc", targetId: "m2" },
        { voterId: "det", targetId: "m2" },
      ],
    });
  });

  test("closing an empty vote sends nobody out", () => {
    const s = closeVote(callVote(day(), "v2"), true);
    expect(s.records.at(-1)).toMatchObject({ ballots: [], out: null });
  });

  test("night falls on any living player's say, into the next night", () => {
    const s = vote(day(), { m1: NO_ONE, m2: NO_ONE, doc: NO_ONE, det: NO_ONE, v2: NO_ONE, v3: NO_ONE });
    expectRefusal("NOT_PLAYING", () => fallNight(s, "v1"));
    const next = fallNight(s, "v2");
    expect(next).toMatchObject({ phase: "night", night: 2, picks: {} });
  });
});

describe("winning", () => {
  test("the town wins when the last Mafia is out", () => {
    let s = night(game(FIVE), quietNight);
    s = vote(s, { m1: "v1", doc: "m1", det: "m1", v1: "m1", v2: "m1" });
    expect(s).toMatchObject({ phase: "over", outcome: "town" });
    expect(scoreGame(s)).toEqual({ m1: 0, doc: 1, det: 1, v1: 1, v2: 1 });
  });

  test("the Mafia win once they equal the town", () => {
    let s = night(game(FIVE), { ...quietNight, doc: "v2" });
    s = vote(s, { m1: "v2", doc: "v2", det: "v2", v2: "m1" });
    expect(s.fates).toEqual({ v1: "killed", v2: "voted" });
    expect(winner(s)).toBeNull();
    s = night(fallNight(s, "doc"), { m1: "doc", doc: "det", det: "doc" });
    expect(winner(s)).toBe("mafia");
    expect(s).toMatchObject({ phase: "over", outcome: "mafia" });
    expect(s.fates.doc).toBe("killed");
    expect(scoreGame(s)).toEqual({ m1: 1, doc: 0, det: 0, v1: 0, v2: 0 });
  });

  test("the dead on the winning side still score", () => {
    let s = night(game(FIVE), { ...quietNight, doc: "v2" });
    s = vote(s, { m1: "doc", doc: "m1", det: "m1", v2: "m1" });
    expect(s.outcome).toBe("town");
    expect(scoreGame(s).v1).toBe(1);
  });
});

describe("leaving mid-game", () => {
  test("is going out: role revealed, picks by and for them dropped", () => {
    let s = night(game(SEVEN), { m1: "v1", m2: "v1", v2: "v1" });
    s = removePlayer(s, "v1");
    expect(s.fates.v1).toBe("left");
    expect(s.picks).toEqual({});
    expect(s.records).toEqual([{ kind: "exit", playerId: "v1" }]);
  });

  test("resolves the night when the leaver was the last one it waited on", () => {
    const waiting = night(game(SEVEN), { m1: "v2", m2: "v2", doc: "v3", det: "m1", v2: "m1", v3: "m1" });
    const s = removePlayer(waiting, "v1");
    expect(s.phase).toBe("day");
    expect(s.records.at(-1)).toMatchObject({ kind: "night", kill: "v2", died: "v2" });
  });

  test("resolves the vote when the leaver was the last one it waited on", () => {
    let s = night(game(SEVEN), { m1: "v1", m2: "v1", doc: "v2", det: "m1", v1: "m1", v2: "m1", v3: "m1" });
    s = vote(s, { m1: "v2", m2: "v2", doc: "m1", det: "m1", v2: "m1" });
    s = removePlayer(s, "v3");
    expect(s.phase).toBe("verdict");
    expect(s.fates).toMatchObject({ v3: "left", m1: "voted" });
  });

  test("a ballot for the leaver is withdrawn", () => {
    let s = callVote(night(game(SEVEN), { m1: "v1", m2: "v1", doc: "v2", det: "m1", v1: "m1", v2: "m1", v3: "m1" }), "v2");
    s = castVote(s, "doc", "v3");
    s = removePlayer(s, "v3");
    expect(s.votes).toEqual({});
  });

  test("the last Mafia leaving hands the town the win", () => {
    const s = removePlayer(game(FIVE), "m1");
    expect(s).toMatchObject({ phase: "over", outcome: "town" });
  });

  test("changes nothing for the dead, outsiders or a finished game", () => {
    const s = night(game(FIVE), { ...quietNight, doc: "v2" });
    expect(removePlayer(s, "v1")).toBe(s);
    expect(removePlayer(s, "zzz")).toBe(s);
    const over = abortGame(s);
    expect(removePlayer(over, "m1")).toBe(over);
  });
});

describe("abort", () => {
  test("ends the game with no score", () => {
    const s = abortGame(game(FIVE));
    expect(s).toMatchObject({ phase: "over", outcome: "aborted" });
    expect(Object.values(scoreGame(s))).toEqual([0, 0, 0, 0, 0]);
  });

  test("does not overwrite a result", () => {
    const won = removePlayer(game(FIVE), "m1");
    expect(abortGame(won).outcome).toBe("town");
  });
});

describe("purity", () => {
  test("transitions never mutate the state handed in", () => {
    const s = game(FIVE);
    const snapshot = JSON.stringify(s);
    night(s, quietNight);
    removePlayer(s, "v1");
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  test("a whole game plays out with no server, database or clock", () => {
    let s = game(SEVEN);
    s = night(s, { m1: "v1", m2: "v1", doc: "v2", det: "m1", v1: "m2", v2: "m2", v3: "m2" });
    s = vote(s, { m1: "v2", m2: "v2", doc: "m1", det: "m1", v2: "m1", v3: "m1" });
    s = fallNight(s, "doc");
    s = night(s, { m2: "det", doc: "doc", det: "m2", v2: "m2", v3: "m2" });
    s = vote(s, { m2: "v3", doc: "m2", v2: "m2", v3: "m2" });
    expect(s).toMatchObject({ phase: "over", outcome: "town", night: 2 });
    expect(s.fates).toEqual({ v1: "killed", m1: "voted", det: "killed", m2: "voted" });
    expect(s.records.map((r) => r.kind)).toEqual(["night", "vote", "night", "vote"]);
  });
});
