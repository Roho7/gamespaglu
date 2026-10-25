import { describe, expect, test } from "vitest";
import { shuffle } from "../game/random";
import { expectRefusal, fixed, seeded } from "../test/helpers";
import {
  abortRound,
  callVote,
  castVote,
  cluesOutstanding,
  dealFor,
  dealRound,
  expireClues,
  pickGrid,
  scoreRound,
  setClueSeconds,
  submitClue,
  submitEscape,
  validateClue,
  type Grid,
  type RoundState,
} from "./engine";

const CLOCK = () => 1_000_000;

const GRID: Grid = {
  id: "test",
  theme: "Test",
  pack: "everyday",
  cells: Array.from({ length: 16 }, (_, i) => `cell${i}`),
};
const P = ["a", "b", "c", "d"];

const deal = (rng = seeded(7)): RoundState => dealRound(P, GRID, rng, CLOCK, 60);

function toDiscuss(s: RoundState): RoundState {
  for (const p of P) s = submitClue(s, p, `clue-${p}`);
  return s;
}

function toEscape(): RoundState {
  let s = callVote(toDiscuss(dealRound(P, GRID, fixed(0), CLOCK, 60)), "b");
  for (const [voter, target] of [["b", "a"], ["c", "a"], ["d", "a"], ["a", "b"]] as const) {
    s = castVote(s, voter, target);
  }
  return s;
}

describe("deal", () => {
  test("produces a full grid, one Girgit and a secret in range", () => {
    const s = deal();
    expect(s.cells).toHaveLength(16);
    expect(new Set(s.cells).size).toBe(16);
    expect(P).toContain(s.girgit);
    expect(s.secretIndex).toBeGreaterThanOrEqual(0);
    expect(s.secretIndex).toBeLessThan(16);
    expect(s.phase).toBe("clues");
  });

  test("refuses below the minimum player count", () => {
    expectRefusal("NOT_ENOUGH_PLAYERS", () => dealRound(["a", "b"], GRID, seeded(1), CLOCK, 60));
  });

  test("refuses a grid that is not exactly 16", () => {
    expectRefusal("INTERNAL", () =>
      dealRound(P, { ...GRID, cells: GRID.cells.slice(0, 15) }, seeded(1), CLOCK, 60),
    );
  });

  test("moves cell positions between rounds, so a grid cannot be learnt by layout", () => {
    const a = dealRound(P, GRID, seeded(3), CLOCK, 60).cells;
    const b = dealRound(P, GRID, seeded(99), CLOCK, 60).cells;
    expect(a).not.toEqual(b);
    expect([...a].sort()).toEqual([...b].sort());
  });

  test("deals the Girgit no secret and everyone else the secret", () => {
    const s = deal();
    const innocent = P.find((p) => p !== s.girgit)!;
    expect(dealFor(s, s.girgit)).toMatchObject({ secretIndex: null, isGirgit: true, theme: s.theme });
    expect(dealFor(s, innocent).secretIndex).toBe(s.secretIndex);
  });

  test("records the grid among those used", () => {
    expect(dealRound(P, GRID, seeded(1), CLOCK, 60, ["old"]).usedGridIds).toEqual(["old", "test"]);
    expect(dealRound(P, GRID, seeded(1), CLOCK, 60, ["test"]).usedGridIds).toEqual(["test"]);
  });

  test("shuffle keeps every element", () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffle(xs, seeded(5)).sort((a, b) => a - b)).toEqual(xs);
  });
});

describe("pickGrid", () => {
  const grid = (id: string, pack: Grid["pack"] = "everyday"): Grid => ({ ...GRID, id, pack });
  const grids = [grid("a"), grid("b"), grid("c", "brands")];

  test("only deals from the packs in play", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(pickGrid(grids, ["brands"], [], null, seeded(seed)).id).toBe("c");
    }
  });

  test("never repeats a grid until the packs are exhausted", () => {
    expect(pickGrid(grids, ["everyday"], ["a"], "a", seeded(1)).id).toBe("b");
  });

  test("refills without repeating the grid just played", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(pickGrid(grids, ["everyday"], ["a", "b"], "b", seeded(seed)).id).toBe("a");
    }
  });

  test("repeats a lone grid rather than dealing nothing", () => {
    expect(pickGrid(grids, ["brands"], ["c"], "c", seeded(1)).id).toBe("c");
  });

  test("refuses packs with no grids", () => {
    expectRefusal("BAD_SETTING", () => pickGrid(grids, ["culture"], [], null, seeded(1)));
  });
});

describe("clues", () => {
  test("stay hidden until the last one lands, then reveal together", () => {
    let s = deal();
    s = submitClue(s, "a", "one");
    s = submitClue(s, "b", "two");
    s = submitClue(s, "c", "three");
    expect(s.phase).toBe("clues");
    expect(cluesOutstanding(s)).toBe(1);
    s = submitClue(s, "d", "four");
    expect(s.phase).toBe("discuss");
    expect(cluesOutstanding(s)).toBe(0);
  });

  test("allow two words but not three", () => {
    const s = deal();
    expect(validateClue(s, "  red   carpet ")).toBe("red carpet");
    expectRefusal("BAD_CLUE", () => validateClue(s, "one two three"));
  });

  test("may not smuggle the secret in beside another word", () => {
    const s: RoundState = { ...deal(), cells: ["Titanic", ...GRID.cells.slice(1)], secretIndex: 0 };
    expectRefusal("BAD_CLUE", () => validateClue(s, "Titanic"));
    expectRefusal("BAD_CLUE", () => validateClue(s, "big Titanic"));
    expectRefusal("BAD_CLUE", () => validateClue(s, "TITANIC"));
    expect(validateClue(s, "iceberg")).toBe("iceberg");
  });

  test("a short secret does not poison every clue containing its letters", () => {
    const s: RoundState = { ...deal(), cells: ["Up", ...GRID.cells.slice(1)], secretIndex: 0 };
    expect(validateClue(s, "syrup")).toBe("syrup");
    expect(validateClue(s, "upset")).toBe("upset");
    expectRefusal("BAD_CLUE", () => validateClue(s, "up"));
    expectRefusal("BAD_CLUE", () => validateClue(s, "look up"));
  });

  test("are refused out of phase, twice, empty, too long, or from outsiders", () => {
    const s = submitClue(deal(), "a", "one");
    expectRefusal("ALREADY_DONE", () => submitClue(s, "a", "again"));
    expectRefusal("NOT_PLAYING", () => submitClue(s, "zzz", "hello"));
    expectRefusal("BAD_CLUE", () => submitClue(s, "b", "   "));
    expectRefusal("BAD_CLUE", () => submitClue(s, "b", "x".repeat(21)));
    expectRefusal("WRONG_PHASE", () => submitClue(callVote(toDiscuss(deal()), "a"), "b", "late"));
  });
});

describe("vote", () => {
  test("can be called by any player", () => {
    const s = callVote(toDiscuss(deal()), "c");
    expect(s.phase).toBe("vote");
    expect(s.voteOpen).toBe(true);
  });

  test("refuses a self vote and a second vote", () => {
    const s = callVote(toDiscuss(deal()), "a");
    expectRefusal("SELF_VOTE", () => castVote(s, "a", "a"));
    expectRefusal("ALREADY_DONE", () => castVote(castVote(s, "a", "b"), "a", "c"));
  });

  test("a tie returns to discussion with the votes cleared", () => {
    let s = callVote(toDiscuss(deal()), "a");
    for (const [voter, target] of [["a", "b"], ["b", "a"], ["c", "d"], ["d", "c"]] as const) {
      s = castVote(s, voter, target);
    }
    expect(s.phase).toBe("discuss");
    expect(s.votes).toEqual({});
    expect(s.outcome).toBeNull();
  });

  test("accusing an innocent ends the round with the Girgit escaping", () => {
    let s = callVote(toDiscuss(dealRound(P, GRID, fixed(0), CLOCK, 60)), "a");
    expect(s.girgit).toBe("a");
    for (const [voter, target] of [["a", "b"], ["b", "c"], ["c", "b"], ["d", "b"]] as const) {
      s = castVote(s, voter, target);
    }
    expect(s).toMatchObject({ accused: "b", phase: "reveal", outcome: "girgit-escaped" });
    expect(scoreRound(s)).toEqual({ a: 2, b: 0, c: 0, d: 0 });
  });
});

describe("escape", () => {
  test("catching the Girgit opens the guess rather than ending the round", () => {
    expect(toEscape()).toMatchObject({ accused: "a", phase: "escape", outcome: null });
  });

  test("only the Girgit may guess, and only a real cell", () => {
    const s = toEscape();
    expectRefusal("NOT_PLAYING", () => submitEscape(s, "b", 0));
    for (const bad of [16, -1, 1.5]) expectRefusal("INTERNAL", () => submitEscape(s, "a", bad));
  });

  test("a right guess scores the Girgit 1; a wrong one pays every innocent", () => {
    const s = toEscape();
    const right = submitEscape(s, "a", s.secretIndex);
    expect(right.outcome).toBe("girgit-guessed");
    expect(scoreRound(right)).toEqual({ a: 1, b: 0, c: 0, d: 0 });

    const wrong = submitEscape(s, "a", (s.secretIndex + 1) % 16);
    expect(wrong.outcome).toBe("girgit-caught");
    expect(scoreRound(wrong)).toEqual({ a: 0, b: 1, c: 1, d: 1 });
  });

  test("an aborted round scores nothing", () => {
    const s = abortRound(toEscape());
    expect(s.outcome).toBe("aborted");
    expect(scoreRound(s)).toEqual({ a: 0, b: 0, c: 0, d: 0 });
  });
});

describe("purity", () => {
  test("transitions never mutate the state handed in", () => {
    const s = deal();
    const snapshot = JSON.stringify(s);
    submitClue(s, "a", "hello");
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  test("a full round plays with no server, database or clock", () => {
    let s = toEscape();
    s = submitEscape(s, "a", s.secretIndex);
    expect(s.phase).toBe("reveal");
    expect(scoreRound(s).a).toBe(1);
  });
});

describe("deadlines", () => {
  test("a locked phone cannot stall the clue phase", () => {
    let s = submitClue(submitClue(deal(), "a", "one"), "b", "two");
    expect(s.phase).toBe("clues");
    s = expireClues(s);
    expect(s.phase).toBe("discuss");
    expect([...s.skipped].sort()).toEqual(["c", "d"]);
    expect(Object.keys(s.clues).sort()).toEqual(["a", "b"]);
  });

  test("only the clue phase carries one", () => {
    let s = deal();
    expect(typeof s.deadlineAt).toBe("number");
    s = toDiscuss(s);
    expect(s.deadlineAt).toBeNull();
    s = callVote(s, "a");
    expect(s.deadlineAt).toBeNull();
  });

  test("a timer change mid-clue is measured from when clues opened", () => {
    let t = 1_000_000;
    const s = dealRound(P, GRID, seeded(7), () => t, 60);
    const opened = s.cluesStartedAt;
    expect(s.deadlineAt).toBe(opened + 60_000);
    t += 25_000;
    const shorter = setClueSeconds(s, 30);
    expect(shorter.deadlineAt).toBe(opened + 30_000);
    expect(shorter.deadlineAt).not.toBe(t + 30_000);
    expect(setClueSeconds(shorter, 60).deadlineAt).toBe(opened + 60_000);
  });

  test("changing the timer outside the clue phase does nothing", () => {
    const s = toDiscuss(deal());
    expect(setClueSeconds(s, 30)).toEqual(s);
  });
});
