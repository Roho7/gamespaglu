import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RuleError,
  abortRound,
  callVote,
  castVote,
  cluesOutstanding,
  expireClues,
  expireEscape,
  expireVote,
  dealFor,
  dealRound,
  scoreRound,
  shuffle,
  submitClue,
  submitEscape,
  validateClue,
  type Grid,
  type RoundState,
} from "./engine";

/** Deterministic rng, so every deal in this file is replayable. */
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
/** Picks the nth option every time — lets a test choose the Girgit exactly. */
const fixed = (v: number) => () => v;
/** A frozen clock. Deadlines are arithmetic, not wall time. */
const CLOCK = () => 1_000_000;

const GRID: Grid = {
  id: "test",
  theme: "Test",
  cells: Array.from({ length: 16 }, (_, i) => `cell${i}`),
};
const P = ["a", "b", "c", "d"];

function deal(rng = seeded(7)): RoundState {
  return dealRound(P, GRID, rng, CLOCK);
}
const throwsWith = (code: string, fn: () => unknown) =>
  assert.throws(fn, (e: unknown) => e instanceof RuleError && e.code === code);

// ------------------------------------------------------------------ deal ---

test("deal produces a full grid, one Girgit, and a secret in range", () => {
  const s = deal();
  assert.equal(s.cells.length, 16);
  assert.equal(new Set(s.cells).size, 16, "no cell is duplicated by the shuffle");
  assert.ok(P.includes(s.girgit));
  assert.ok(s.secretIndex >= 0 && s.secretIndex < 16);
  assert.equal(s.phase, "clues");
});

test("deal refuses below the minimum player count", () => {
  throwsWith("NOT_ENOUGH_PLAYERS", () => dealRound(["a", "b"], GRID, seeded(1), CLOCK));
});

test("deal refuses a grid that is not exactly 16", () => {
  throwsWith("INTERNAL", () =>
    dealRound(P, { ...GRID, cells: GRID.cells.slice(0, 15) }, seeded(1), CLOCK),
  );
});

test("cell positions move between rounds, so a grid cannot be learnt by layout", () => {
  const a = dealRound(P, GRID, seeded(3), CLOCK).cells;
  const b = dealRound(P, GRID, seeded(99), CLOCK).cells;
  assert.notDeepEqual(a, b);
  assert.deepEqual([...a].sort(), [...b].sort(), "same 16 words, different places");
});

test("the Girgit is dealt no secret; everyone else is", () => {
  const s = deal();
  const innocent = P.find((p) => p !== s.girgit)!;
  assert.equal(dealFor(s, s.girgit).secretIndex, null);
  assert.equal(dealFor(s, s.girgit).isGirgit, true);
  assert.equal(dealFor(s, innocent).secretIndex, s.secretIndex);
  // The theme is public precisely so the Girgit can bluff at all.
  assert.equal(dealFor(s, s.girgit).theme, s.theme);
});

test("shuffle keeps every element", () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(shuffle(xs, seeded(5)).sort((a, b) => a - b), xs);
});

// ----------------------------------------------------------------- clues ---

test("clues stay hidden until the last one lands, then reveal together", () => {
  let s = deal();
  s = submitClue(s, "a", "one");
  s = submitClue(s, "b", "two");
  s = submitClue(s, "c", "three");
  assert.equal(s.phase, "clues", "still collecting");
  assert.equal(cluesOutstanding(s), 1);
  s = submitClue(s, "d", "four");
  assert.equal(s.phase, "discuss", "all four in — reveal");
  assert.equal(cluesOutstanding(s), 0);
});

test("two words are allowed, three are not", () => {
  const s = deal();
  assert.equal(validateClue(s, "  red   carpet "), "red carpet");
  throwsWith("BAD_CLUE", () => validateClue(s, "one two three"));
});

test("a clue may not smuggle the secret word in beside another", () => {
  // Explicit cells: dealRound shuffles, so relying on its ordering here would
  // make the test assert against whatever the rng happened to do.
  const s: RoundState = { ...deal(), cells: ["Titanic", ...GRID.cells.slice(1)], secretIndex: 0 };
  throwsWith("BAD_CLUE", () => validateClue(s, "Titanic"));
  // The case an equality check would have waved straight through.
  throwsWith("BAD_CLUE", () => validateClue(s, "big Titanic"));
  throwsWith("BAD_CLUE", () => validateClue(s, "TITANIC"));
  assert.equal(validateClue(s, "iceberg"), "iceberg");
});

test("a short secret does not poison every clue that contains its letters", () => {
  // "Up", "It" and "Us" are real titles in the deck. A raw substring check
  // would reject "syrup" for "Up", which reads to the player as the app being
  // broken — and they cannot see why, because they cannot see the secret.
  const s: RoundState = { ...deal(), cells: ["Up", ...GRID.cells.slice(1)], secretIndex: 0 };
  assert.equal(validateClue(s, "syrup"), "syrup");
  assert.equal(validateClue(s, "upset"), "upset");
  throwsWith("BAD_CLUE", () => validateClue(s, "up"));
  throwsWith("BAD_CLUE", () => validateClue(s, "look up"));
});

test("clues are rejected outside the clue phase, twice, or from outsiders", () => {
  let s = deal();
  s = submitClue(s, "a", "one");
  throwsWith("ALREADY_DONE", () => submitClue(s, "a", "again"));
  throwsWith("NOT_PLAYING", () => submitClue(s, "zzz", "hello"));
  throwsWith("BAD_CLUE", () => submitClue(s, "b", "   "));
  throwsWith("BAD_CLUE", () => submitClue(s, "b", "x".repeat(21)));
  const voting = callVote(
    { ...s, clues: { a: "1", b: "2", c: "3", d: "4" }, phase: "discuss" },
    "a",
    CLOCK,
  );
  throwsWith("WRONG_PHASE", () => submitClue(voting, "b", "late"));
});

// ------------------------------------------------------------------ vote ---

function toDiscuss(s: RoundState): RoundState {
  for (const p of P) s = submitClue(s, p, `clue-${p}`);
  return s;
}

test("any player can call the vote, not just the host", () => {
  const s = callVote(toDiscuss(deal()), "c", CLOCK);
  assert.equal(s.phase, "vote");
  assert.equal(s.voteOpen, true);
});

test("you cannot vote for yourself, or twice", () => {
  const s = callVote(toDiscuss(deal()), "a", CLOCK);
  throwsWith("SELF_VOTE", () => castVote(s, "a", "a", CLOCK));
  const once = castVote(s, "a", "b", CLOCK);
  throwsWith("ALREADY_DONE", () => castVote(once, "a", "c", CLOCK));
});

test("a tie returns the room to discussion and clears the votes", () => {
  let s = callVote(toDiscuss(deal()), "a", CLOCK);
  s = castVote(s, "a", "b", CLOCK);
  s = castVote(s, "b", "a", CLOCK);
  s = castVote(s, "c", "d", CLOCK);
  s = castVote(s, "d", "c", CLOCK);
  assert.equal(s.phase, "discuss", "2-2-... no plurality");
  assert.deepEqual(s.votes, {}, "a re-vote starts clean");
  assert.equal(s.outcome, null);
});

test("accusing an innocent ends the round and the Girgit escapes", () => {
  // fixed(0) makes player[0] the Girgit and cell 0 the secret.
  let s = dealRound(P, GRID, fixed(0), CLOCK);
  assert.equal(s.girgit, "a");
  s = callVote(toDiscuss(s), "a", CLOCK);
  s = castVote(s, "a", "b", CLOCK);
  s = castVote(s, "b", "c", CLOCK);
  s = castVote(s, "c", "b", CLOCK);
  s = castVote(s, "d", "b", CLOCK);
  assert.equal(s.accused, "b");
  assert.equal(s.phase, "reveal");
  assert.equal(s.outcome, "girgit-escaped");
  assert.deepEqual(scoreRound(s), { a: 2, b: 0, c: 0, d: 0 });
});

// ---------------------------------------------------------------- escape ---

function toEscape(): RoundState {
  let s = dealRound(P, GRID, fixed(0), CLOCK); // girgit = a, secret = cell index 0
  s = callVote(toDiscuss(s), "b", CLOCK);
  s = castVote(s, "b", "a", CLOCK);
  s = castVote(s, "c", "a", CLOCK);
  s = castVote(s, "d", "a", CLOCK);
  s = castVote(s, "a", "b", CLOCK);
  return s;
}

test("catching the Girgit opens the escape guess rather than ending it", () => {
  const s = toEscape();
  assert.equal(s.accused, "a");
  assert.equal(s.phase, "escape");
  assert.equal(s.outcome, null, "nothing is decided until they guess");
});

test("only the Girgit may guess, and only a real cell", () => {
  const s = toEscape();
  throwsWith("NOT_PLAYING", () => submitEscape(s, "b", 0));
  throwsWith("INTERNAL", () => submitEscape(s, "a", 16));
  throwsWith("INTERNAL", () => submitEscape(s, "a", -1));
  throwsWith("INTERNAL", () => submitEscape(s, "a", 1.5));
});

test("a correct guess escapes for 1; a wrong one pays every innocent", () => {
  const s = toEscape();
  const right = submitEscape(s, "a", s.secretIndex);
  assert.equal(right.outcome, "girgit-guessed");
  assert.deepEqual(scoreRound(right), { a: 1, b: 0, c: 0, d: 0 });

  const wrong = submitEscape(s, "a", (s.secretIndex + 1) % 16);
  assert.equal(wrong.outcome, "girgit-caught");
  assert.deepEqual(scoreRound(wrong), { a: 0, b: 1, c: 1, d: 1 });
});

test("an aborted round scores nothing for anybody", () => {
  const s = abortRound(toEscape());
  assert.equal(s.outcome, "aborted");
  assert.deepEqual(scoreRound(s), { a: 0, b: 0, c: 0, d: 0 });
});

// ----------------------------------------------------------------- misc ---

test("transitions never mutate the state handed in", () => {
  const s = deal();
  const snapshot = JSON.stringify(s);
  submitClue(s, "a", "hello");
  assert.equal(JSON.stringify(s), snapshot);
});

test("a full round can be played with no server, database or clock", () => {
  let s = dealRound(P, GRID, fixed(0), CLOCK);
  for (const p of P) s = submitClue(s, p, `c-${p}`);
  s = callVote(s, "d", CLOCK);
  for (const [v, t] of [["b", "a"], ["c", "a"], ["d", "a"], ["a", "c"]] as const) {
    s = castVote(s, v, t, CLOCK);
  }
  s = submitEscape(s, "a", s.secretIndex);
  assert.equal(s.phase, "reveal");
  assert.equal(scoreRound(s).a, 1);
});

// --------------------------------------------------- deadlines and stalls ---
//
// These exist because of a real game: two players locked their phones during
// the vote, advancing required everybody to act, and the round could never
// finish. A held SEAT is forever; a held PHASE is not.

test("a locked phone cannot stall the clue phase forever", () => {
  let s = deal();
  s = submitClue(s, "a", "one");
  s = submitClue(s, "b", "two");
  assert.equal(s.phase, "clues", "still waiting on c and d");

  s = expireClues(s);
  assert.equal(s.phase, "discuss");
  assert.deepEqual(s.skipped.sort(), ["c", "d"]);
  // The clues that WERE given still stand and still reveal.
  assert.deepEqual(Object.keys(s.clues).sort(), ["a", "b"]);
});

test("the vote resolves on the votes actually cast", () => {
  // Exactly the shape of the stuck round: girgit a, only two players vote.
  let s = dealRound(P, GRID, fixed(0), CLOCK);
  s = expireClues(s);
  s = callVote(s, "b", CLOCK);
  s = castVote(s, "b", "a", CLOCK);
  s = castVote(s, "c", "a", CLOCK);
  assert.equal(s.phase, "vote", "d and a have not voted");

  s = expireVote(s, CLOCK);
  assert.equal(s.phase, "escape", "two votes are enough to accuse");
  assert.equal(s.accused, "a");
});

test("nobody voting returns the room to discussion rather than accusing at random", () => {
  let s = dealRound(P, GRID, fixed(0), CLOCK);
  s = expireClues(s);
  s = callVote(s, "b", CLOCK);
  s = expireVote(s, CLOCK);
  assert.equal(s.phase, "discuss");
  assert.equal(s.accused, null);
  assert.deepEqual(s.votes, {});
});

test("deadlines are set on timed phases and cleared on untimed ones", () => {
  const dealt = deal();
  assert.equal(typeof dealt.deadlineAt, "number", "clues are timed");

  let s = dealt;
  for (const p of P) s = submitClue(s, p, `c-${p}`);
  assert.equal(s.deadlineAt, null, "discussion is never timed");

  s = callVote(s, "a", CLOCK);
  assert.equal(typeof s.deadlineAt, "number", "the vote is timed");

  s = castVote(s, "a", "b", CLOCK);
  s = castVote(s, "b", "c", CLOCK);
  s = castVote(s, "c", "b", CLOCK);
  s = castVote(s, "d", "b", CLOCK);
  assert.equal(s.deadlineAt, null, "the reveal is not timed");
});

test("expiry is a no-op outside its own phase", () => {
  const s = deal();
  assert.deepEqual(expireVote(s, CLOCK), s);
  const revealed = abortRound(s);
  assert.deepEqual(expireClues(revealed), revealed);
});

test("a locked phone cannot stall the escape either", () => {
  let s = dealRound(P, GRID, fixed(0), CLOCK);
  s = expireClues(s);
  s = callVote(s, "b", CLOCK);
  s = castVote(s, "b", "a", CLOCK);
  s = castVote(s, "c", "a", CLOCK);
  s = expireVote(s, CLOCK);
  assert.equal(s.phase, "escape");
  assert.equal(typeof s.deadlineAt, "number", "the guess is timed");

  // Not answering is not an escape.
  s = expireEscape(s);
  assert.equal(s.phase, "reveal");
  assert.equal(s.outcome, "girgit-caught");
  assert.deepEqual(scoreRound(s), { a: 0, b: 1, c: 1, d: 1 });
});
