import { describe, expect, test } from "vitest";
import type { Policy, ShAction, ShPower, ShRole } from "../../../shared/protocol";
import { expectRefusal, seats, seeded } from "../test/helpers";
import {
  abortSh,
  dealSh,
  eligibleChancellors,
  nightKnowledge,
  reduce,
  scoreSh,
  type ShState,
} from "./engine";
import { publicRound, yourRound } from "./views";

const L: Policy = "liberal";
const F: Policy = "fascist";
const rng = seeded(7);
const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

/** Liberals first, then Fascists, Hitler in the last seat. p0 holds the first presidency. */
function table(n: number, over: Partial<ShState> = {}): ShState {
  const dealt = dealSh(seats(ids(n)), rng);
  const liberals = Math.floor(n / 2) + 1;
  const roles: Record<string, ShRole> = {};
  ids(n).forEach((id, i) => (roles[id] = i < liberals ? "liberal" : i === n - 1 ? "hitler" : "fascist"));
  return { ...dealt, roles, rotation: 0, president: "p0", deck: [L, L, L, F, F, F, L, F, F, F, L, F, F, F, L, F, F], ...over };
}

const act = (s: ShState, by: string, action: ShAction) => reduce(s, by, action, rng);

function voteAll(s: ShState, ja: boolean | ((id: string) => boolean)) {
  for (const id of s.players.filter((p) => !s.dead.includes(p))) {
    s = act(s, id, { type: "vote", ja: typeof ja === "boolean" ? ja : ja(id) });
  }
  return s;
}

const elect = (s: ShState, chancellor: string) =>
  voteAll(act(s, s.president, { type: "nominate", targetId: chancellor }), true);

const reject = (s: ShState, chancellor: string) =>
  voteAll(act(s, s.president, { type: "nominate", targetId: chancellor }), false);

function legislate(s: ShState, chancellor: string, keep: Policy) {
  s = elect(s, chancellor);
  const drop = s.hand.findIndex((p) => p !== keep);
  s = act(s, s.president, { type: "discard", index: drop === -1 ? 0 : drop });
  return act(s, chancellor, { type: "enact", index: s.hand.indexOf(keep) });
}

const tiles = (s: ShState) => s.deck.length + s.discard.length + s.hand.length + s.liberal + s.fascist;

describe("the deal", () => {
  test.each([
    [5, 3, 1],
    [6, 4, 1],
    [7, 4, 2],
    [8, 5, 2],
    [9, 5, 3],
    [10, 6, 3],
  ])("%i players get %i Liberals, %i Fascists and one Hitler", (n, liberals, fascists) => {
    const roles = Object.values(dealSh(seats(ids(n)), seeded(n)).roles);
    expect(roles.filter((r) => r === "liberal")).toHaveLength(liberals);
    expect(roles.filter((r) => r === "fascist")).toHaveLength(fascists);
    expect(roles.filter((r) => r === "hitler")).toHaveLength(1);
  });

  test("refuses fewer than five or more than ten", () => {
    expectRefusal("NOT_ENOUGH_PLAYERS", () => dealSh(seats(ids(4)), rng));
    expectRefusal("ROOM_FULL", () => dealSh(seats(ids(11)), rng));
  });

  test("shuffles 6 Liberal and 11 Fascist policies into one deck", () => {
    const deck = dealSh(seats(ids(5)), rng).deck;
    expect(deck.filter((p) => p === L)).toHaveLength(6);
    expect(deck.filter((p) => p === F)).toHaveLength(11);
  });

  test("starts with a nomination from a randomly seated President", () => {
    const starts = new Set([1, 2, 3, 4, 5, 6].map((seed) => dealSh(seats(ids(7)), seeded(seed)).president));
    expect(starts.size).toBeGreaterThan(1);
    expect(dealSh(seats(ids(7)), rng).phase).toBe("nominate");
  });
});

describe("the night", () => {
  test("at 5 and 6 players the Fascist and Hitler know each other", () => {
    for (const n of [5, 6]) {
      const s = table(n);
      const fascist = `p${n - 2}`;
      const hitler = `p${n - 1}`;
      expect(nightKnowledge(s, fascist)).toEqual([hitler]);
      expect(nightKnowledge(s, hitler)).toEqual([fascist]);
    }
  });

  test("at 7 to 10 players the Fascists know each other and Hitler, and Hitler knows nobody", () => {
    for (const n of [7, 8, 9, 10]) {
      const s = table(n);
      const team = s.players.filter((p) => s.roles[p] !== "liberal");
      const hitler = `p${n - 1}`;
      expect(nightKnowledge(s, hitler)).toEqual([]);
      for (const f of team.filter((p) => p !== hitler)) {
        expect(nightKnowledge(s, f)).toEqual(team.filter((p) => p !== f));
      }
    }
  });

  test("Liberals know nobody", () => {
    expect(nightKnowledge(table(10), "p0")).toEqual([]);
  });
});

describe("presidency", () => {
  test("passes clockwise after a policy is enacted and after a failed vote", () => {
    const s = legislate(table(5), "p2", L);
    expect(s.president).toBe("p1");
    expect(reject(s, "p3").president).toBe("p2");
  });

  test("skips the dead", () => {
    const s = legislate(table(6, { dead: ["p1"] }), "p2", L);
    expect(s.president).toBe("p2");
  });

  test("wraps from the last seat to the first", () => {
    expect(reject(table(5, { rotation: 4, president: "p4" }), "p1").president).toBe("p0");
  });
});

describe("nomination and term limits", () => {
  test("bars the last elected President and Chancellor with six or more alive", () => {
    let s = legislate(table(6), "p3", L);
    expect(s.president).toBe("p1");
    expect(eligibleChancellors(s)).toEqual(["p2", "p4", "p5"]);
    expectRefusal("BAD_TARGET", () => act(s, "p1", { type: "nominate", targetId: "p0" }));
    expectRefusal("BAD_TARGET", () => act(s, "p1", { type: "nominate", targetId: "p3" }));
    s = act(s, "p1", { type: "nominate", targetId: "p2" });
    expect(s.phase).toBe("vote");
  });

  test("with five players alive only the last Chancellor is barred", () => {
    const s = legislate(table(5), "p3", L);
    expect(eligibleChancellors(s)).toEqual(["p0", "p2", "p4"]);
  });

  test("a bigger table that has lost players to execution uses the five-player rule", () => {
    const s = legislate(table(7, { dead: ["p5", "p6"] }), "p3", L);
    expect(s.president).toBe("p1");
    expect(eligibleChancellors(s)).toContain("p0");
    expect(eligibleChancellors(s)).not.toContain("p3");
  });

  test("a failed nomination sets no term limit", () => {
    const s = reject(table(6), "p3");
    expect(s.termLimited).toBeNull();
    expect(eligibleChancellors(s)).toContain("p3");
  });

  test("the President can't nominate themselves, the dead, or act out of turn", () => {
    const s = table(6, { dead: ["p2"] });
    expectRefusal("BAD_TARGET", () => act(s, "p0", { type: "nominate", targetId: "p0" }));
    expectRefusal("BAD_TARGET", () => act(s, "p0", { type: "nominate", targetId: "p2" }));
    expectRefusal("NOT_PLAYING", () => act(s, "p1", { type: "nominate", targetId: "p3" }));
  });

  test("term limits never bar the Presidency", () => {
    const s = legislate(table(6, { rotation: 5, president: "p5" }), "p0", L);
    expect(s.president).toBe("p0");
  });
});

describe("voting", () => {
  test("a majority of Ja elects the government and hands the President three tiles", () => {
    const s = voteAll(act(table(5), "p0", { type: "nominate", targetId: "p1" }), (id) => id !== "p4");
    expect(s.phase).toBe("president");
    expect(s.hand).toEqual([L, L, L]);
    expect(s.lastVote?.passed).toBe(true);
  });

  test("a tie fails", () => {
    const s = voteAll(act(table(6), "p0", { type: "nominate", targetId: "p1" }), (id) => ["p0", "p1", "p2"].includes(id));
    expect(s.lastVote?.passed).toBe(false);
    expect(s.tracker).toBe(1);
    expect(s.phase).toBe("nominate");
  });

  test("the dead don't vote and don't count towards the majority", () => {
    let s = act(table(6, { dead: ["p5"] }), "p0", { type: "nominate", targetId: "p1" });
    expectRefusal("NOT_PLAYING", () => act(s, "p5", { type: "vote", ja: true }));
    s = voteAll(s, (id) => ["p0", "p1", "p2"].includes(id));
    expect(s.lastVote?.ballots).toHaveLength(5);
    expect(s.lastVote?.passed).toBe(true);
  });

  test("nobody votes twice, and ballots stay sealed until the last one is in", () => {
    let s = act(table(5), "p0", { type: "nominate", targetId: "p1" });
    s = act(s, "p0", { type: "vote", ja: false });
    expectRefusal("ALREADY_DONE", () => act(s, "p0", { type: "vote", ja: true }));
    expect(s.lastVote).toBeNull();
    expect(publicRound(s, 1).roster.find((p) => p.id === "p0")?.voted).toBe(true);
  });
});

describe("legislative session", () => {
  test("the President discards one of three and the Chancellor enacts one of two", () => {
    let s = elect(table(5, { deck: [F, L, F, ...table(5).deck.slice(3)] }), "p1");
    expectRefusal("NOT_PLAYING", () => act(s, "p1", { type: "discard", index: 0 }));
    s = act(s, "p0", { type: "discard", index: 0 });
    expect(s.phase).toBe("chancellor");
    expect(s.hand).toEqual([L, F]);
    expectRefusal("NOT_PLAYING", () => act(s, "p0", { type: "enact", index: 0 }));
    s = act(s, "p1", { type: "enact", index: 0 });
    expect([s.liberal, s.fascist]).toEqual([1, 0]);
    expect(s.discard).toEqual([F, F]);
    expect(tiles(s)).toBe(17);
  });

  test("refuses a tile that isn't in the hand", () => {
    const s = elect(table(5), "p1");
    expectRefusal("BAD_ACTION", () => act(s, "p0", { type: "discard", index: 3 }));
  });

  test("an enacted policy resets the Election Tracker", () => {
    const s = legislate(table(5, { tracker: 2 }), "p1", L);
    expect(s.tracker).toBe(0);
  });
});

describe("reshuffle", () => {
  test("fewer than three tiles left after a session shuffles in the discards", () => {
    const s = legislate(table(5, { deck: [L, F, F, L, F], discard: [F, F, F, F, F, F, F, L, L, L, F, F] }), "p1", L);
    expect(s.deck).toHaveLength(16);
    expect(s.discard).toEqual([]);
    expect(tiles(s)).toBe(17);
  });

  test("three or more left stays put", () => {
    const s = legislate(table(5, { deck: [L, F, F, L, F, F], discard: [F, F, F, F, F, F, F, L, L, L, F] }), "p1", L);
    expect(s.deck).toEqual([L, F, F]);
  });

  test("chaos leaving fewer than three shuffles too", () => {
    const s = reject(table(5, { tracker: 2, deck: [L, F, F], discard: Array<Policy>(14).fill(F) }), "p1");
    expect(s.liberal).toBe(1);
    expect(s.deck).toHaveLength(16);
    expect(s.discard).toEqual([]);
  });
});

describe("election tracker and chaos", () => {
  test("three failed elections enact the top tile, reset the tracker and forget term limits", () => {
    let s = legislate(table(6), "p3", L);
    s = reject(s, "p2");
    s = reject(s, "p4");
    expect(s.tracker).toBe(2);
    expect(s.termLimited).not.toBeNull();
    s = reject(s, "p5");
    expect(s.tracker).toBe(0);
    expect(s.liberal + s.fascist).toBe(2);
    expect(s.termLimited).toBeNull();
    expect(s.news).toMatchObject({ kind: "enacted", chaos: true });
  });

  test("a chaos policy grants no power", () => {
    const s = reject(table(5, { tracker: 2, fascist: 2, deck: [F, L, L, ...table(5).deck] }), "p1");
    expect(s.fascist).toBe(3);
    expect(s.phase).toBe("nominate");
    expect(s.power).toBeNull();
  });

  test("a chaos policy can still win the game", () => {
    const s = reject(table(5, { tracker: 2, liberal: 4 }), "p1");
    expect(s.outcome).toEqual({ winner: "liberal", reason: "liberal-policies" });
  });
});

describe("veto", () => {
  const vetoTable = (over: Partial<ShState> = {}) => {
    const s = elect(table(7, { fascist: 5, ...over }), "p1");
    return act(s, "p0", { type: "discard", index: 0 });
  };

  test("is unavailable before the fifth Fascist policy", () => {
    const s = act(elect(table(7, { fascist: 4 }), "p1"), "p0", { type: "discard", index: 0 });
    expect(yourRound(s, "p1").canVeto).toBe(false);
    expectRefusal("WRONG_PHASE", () => act(s, "p1", { type: "veto" }));
  });

  test("an agreed veto discards both tiles, advances the tracker and passes the presidency", () => {
    let s = vetoTable();
    expect(yourRound(s, "p1").canVeto).toBe(true);
    s = act(s, "p1", { type: "veto" });
    expectRefusal("NOT_PLAYING", () => act(s, "p1", { type: "veto:answer", agree: true }));
    s = act(s, "p0", { type: "veto:answer", agree: true });
    expect([s.liberal, s.fascist, s.tracker]).toEqual([0, 5, 1]);
    expect(s.discard).toHaveLength(3);
    expect(s.president).toBe("p1");
    expect(s.termLimited).toEqual({ president: "p0", chancellor: "p1" });
  });

  test("a refused veto makes the Chancellor enact, and they can't ask again", () => {
    let s = act(vetoTable(), "p1", { type: "veto" });
    s = act(s, "p0", { type: "veto:answer", agree: false });
    expect(s.phase).toBe("chancellor");
    expect(yourRound(s, "p1").canVeto).toBe(false);
    expectRefusal("ALREADY_DONE", () => act(s, "p1", { type: "veto" }));
    s = act(s, "p1", { type: "enact", index: 0 });
    expect(s.liberal + s.fascist).toBe(6);
  });

  test("a veto that takes the tracker to three sets off chaos", () => {
    let s = act(vetoTable({ tracker: 2 }), "p1", { type: "veto" });
    s = act(s, "p0", { type: "veto:answer", agree: true });
    expect(s.tracker).toBe(0);
    expect(s.liberal + s.fascist).toBe(6);
    expect(s.news).toMatchObject({ kind: "vetoed" });
  });
});

describe("presidential powers", () => {
  const boards: [number, (ShPower | null)[]][] = [
    [5, [null, null, "peek", "execute", "execute"]],
    [6, [null, null, "peek", "execute", "execute"]],
    [7, [null, "investigate", "special-election", "execute", "execute"]],
    [8, [null, "investigate", "special-election", "execute", "execute"]],
    [9, ["investigate", "investigate", "special-election", "execute", "execute"]],
    [10, ["investigate", "investigate", "special-election", "execute", "execute"]],
  ];

  test.each(boards)("the %i-player board grants %j", (n, powers) => {
    powers.forEach((power, slot) => {
      const s = legislate(table(n, { fascist: slot, deck: [F, F, F, ...table(n).deck] }), "p1", F);
      expect(s.fascist).toBe(slot + 1);
      expect(s.power).toBe(power);
      expect(s.phase).toBe(power ? "power" : "nominate");
      expect(s.president).toBe(power ? "p0" : "p1");
    });
  });

  const withPower = (n: number, power: ShPower) =>
    table(n, { phase: "power", power, chancellor: "p1" });

  test("Investigate shows the President a Party Membership, with Hitler as Fascist", () => {
    const s = act(withPower(7, "investigate"), "p0", { type: "investigate", targetId: "p6" });
    expect(yourRound(s, "p0").investigations).toEqual([{ playerId: "p6", party: "fascist" }]);
    expect(yourRound(s, "p1").investigations).toEqual([]);
    expect(s.president).toBe("p1");
  });

  test("nobody is investigated twice, and the President can't investigate themselves", () => {
    const s = withPower(9, "investigate");
    const again = { ...s, investigations: [{ by: "p3", target: "p2" }] };
    expectRefusal("BAD_TARGET", () => act(again, "p0", { type: "investigate", targetId: "p2" }));
    expectRefusal("BAD_TARGET", () => act(s, "p0", { type: "investigate", targetId: "p0" }));
  });

  test("only the President uses a power, and only the one on the board", () => {
    const s = withPower(7, "investigate");
    expectRefusal("NOT_PLAYING", () => act(s, "p1", { type: "investigate", targetId: "p2" }));
    expectRefusal("WRONG_PHASE", () => act(s, "p0", { type: "execute", targetId: "p2" }));
  });

  test("a Special Election hands over the Presidency, then rotation resumes left of the caller", () => {
    let s = act(withPower(7, "special-election"), "p0", { type: "special-election", targetId: "p4" });
    expect(s.president).toBe("p4");
    expect(s.phase).toBe("nominate");
    s = legislate(s, "p0", L);
    expect(s.president).toBe("p1");
  });

  test("a failed Special Election also returns to the left of the caller", () => {
    let s = act(withPower(7, "special-election"), "p0", { type: "special-election", targetId: "p4" });
    s = reject(s, "p0");
    expect(s.president).toBe("p1");
  });

  test("picking the next player in rotation lets them run twice", () => {
    let s = act(withPower(7, "special-election"), "p0", { type: "special-election", targetId: "p1" });
    s = legislate(s, "p2", L);
    expect(s.president).toBe("p1");
  });

  test("a Special Election may pick a term-limited player but not the caller", () => {
    const s = withPower(8, "special-election");
    const limited = { ...s, termLimited: { president: "p5", chancellor: "p1" } };
    expect(act(limited, "p0", { type: "special-election", targetId: "p1" }).president).toBe("p1");
    expectRefusal("BAD_TARGET", () => act(s, "p0", { type: "special-election", targetId: "p0" }));
  });

  test("Policy Peek shows the President the top three in order and changes nothing", () => {
    const s = withPower(5, "peek");
    expect(yourRound(s, "p0").peek).toEqual(s.deck.slice(0, 3));
    expect(yourRound(s, "p1").peek).toBeNull();
    const after = act(s, "p0", { type: "peek:done" });
    expect(after.deck).toEqual(s.deck);
    expect(after.president).toBe("p1");
  });

  test("an executed player can't vote, be nominated or hold the Presidency, and their role stays hidden", () => {
    let s = act(withPower(5, "execute"), "p0", { type: "execute", targetId: "p3" });
    expect(publicRound(s, 1).roster.find((p) => p.id === "p3")).toMatchObject({ alive: false, role: null });
    expect(eligibleChancellors(s)).not.toContain("p3");
    s = { ...s, rotation: 2, president: "p2" };
    s = reject(s, "p0");
    expect(s.president).toBe("p4");
    s = act(s, "p4", { type: "nominate", targetId: "p0" });
    expectRefusal("NOT_PLAYING", () => act(s, "p3", { type: "vote", ja: true }));
  });

  test("the President can't execute themselves or the dead", () => {
    const s = withPower(6, "execute");
    expectRefusal("BAD_TARGET", () => act(s, "p0", { type: "execute", targetId: "p0" }));
    expectRefusal("BAD_TARGET", () => act({ ...s, dead: ["p2"] }, "p0", { type: "execute", targetId: "p2" }));
  });
});

describe("winning", () => {
  test("the fifth Liberal policy wins for the Liberals", () => {
    const s = legislate(table(5, { liberal: 4 }), "p1", L);
    expect(s.outcome).toEqual({ winner: "liberal", reason: "liberal-policies" });
    expect(s.phase).toBe("over");
  });

  test("the sixth Fascist policy wins for the Fascists", () => {
    const s = legislate(table(5, { fascist: 5, deck: [F, F, F, ...table(5).deck] }), "p1", F);
    expect(s.outcome).toEqual({ winner: "fascist", reason: "fascist-policies" });
  });

  test("executing Hitler wins for the Liberals", () => {
    const s = act(table(5, { phase: "power", power: "execute" }), "p0", { type: "execute", targetId: "p4" });
    expect(s.outcome).toEqual({ winner: "liberal", reason: "hitler-executed" });
  });

  test("Hitler elected Chancellor after three Fascist policies wins for the Fascists", () => {
    const s = elect(table(5, { fascist: 3 }), "p4");
    expect(s.outcome).toEqual({ winner: "fascist", reason: "hitler-elected" });
  });

  test("Hitler elected with fewer than three Fascist policies is just a Chancellor", () => {
    const s = elect(table(5, { fascist: 2 }), "p4");
    expect(s.phase).toBe("president");
    expect(s.notHitler).toEqual([]);
  });

  test("any other Chancellor elected in Hitler territory is confirmed not Hitler", () => {
    const s = elect(table(5, { fascist: 3 }), "p3");
    expect(publicRound(s, 1).roster.find((p) => p.id === "p3")?.notHitler).toBe(true);
  });

  test("the winning side scores, the dead included, and every role is shown", () => {
    const s = legislate(table(5, { liberal: 4, dead: ["p2"] }), "p1", L);
    expect(scoreSh(s)).toEqual({ p0: 1, p1: 1, p2: 1, p3: 0, p4: 0 });
    expect(publicRound(s, 1).roster.map((p) => p.role)).toEqual(["liberal", "liberal", "liberal", "fascist", "hitler"]);
  });

  test("no moves after the game ends", () => {
    const s = legislate(table(5, { liberal: 4 }), "p1", L);
    expectRefusal("WRONG_PHASE", () => act(s, "p1", { type: "nominate", targetId: "p2" }));
  });

  test("a player leaving ends the game with no winner and no points", () => {
    const s = abortSh(table(5));
    expect(s.outcome).toEqual({ winner: null, reason: "aborted" });
    expect(Object.values(scoreSh(s))).toEqual([0, 0, 0, 0, 0]);
  });
});
