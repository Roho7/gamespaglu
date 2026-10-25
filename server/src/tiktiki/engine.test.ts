import { describe, expect, test } from "vitest";
import { PLACE_IDS, SUSPECT_COUNT, type PlaceId } from "../../../shared/protocol";
import { expectRefusal, seats, seeded } from "../test/helpers";
import {
  abortRound,
  accuse,
  castVerdict,
  closeTrial,
  dealTiktiki,
  expireClock,
  guessPlace,
  removePlayer,
  scoreRound,
  type TiktikiState,
} from "./engine";
import { publicRound, yourRound } from "./views";

const IDS = ["spy", "a", "b", "c", "d"];
const T0 = 1_000_000;

function fresh(): TiktikiState {
  const s = dealTiktiki(seats(IDS), 8, null, seeded(7), T0);
  return { ...s, tiktikiId: "spy" };
}

const wrongPlace = (s: TiktikiState): PlaceId => s.suspects.find((p) => p !== s.placeId) as PlaceId;

function convict(s: TiktikiState, accuser: string, accused: string, at = T0 + 60_000) {
  let next = accuse(s, accuser, accused, at);
  for (const p of IDS.filter((p) => p !== accuser && p !== accused)) next = castVerdict(next, p, true, at);
  return next;
}

describe("deal", () => {
  test("puts the real place among twelve distinct suspects and starts the clock", () => {
    const s = dealTiktiki(seats(IDS), 6, null, seeded(1), T0);
    expect(s.suspects).toHaveLength(SUSPECT_COUNT);
    expect(new Set(s.suspects).size).toBe(SUSPECT_COUNT);
    expect(s.suspects).toContain(s.placeId);
    expect(IDS).toContain(s.tiktikiId);
    expect(s.deadlineAt).toBe(T0 + 6 * 60_000);
  });

  test("runs through the whole pool before repeating a place", () => {
    let prev: TiktikiState | null = null;
    const seen: PlaceId[] = [];
    for (let i = 0; i < PLACE_IDS.length; i++) {
      prev = dealTiktiki(seats(IDS), 8, prev, seeded(i + 3), T0);
      seen.push(prev.placeId);
    }
    expect(new Set(seen).size).toBe(PLACE_IDS.length);
    const next = dealTiktiki(seats(IDS), 8, prev, seeded(99), T0);
    expect(next.placeId).not.toBe(prev?.placeId);
  });

  test("refuses too few players", () => {
    expectRefusal("NOT_ENOUGH_PLAYERS", () => dealTiktiki(seats(["a", "b", "c"]), 8, null, seeded(1), T0));
  });
});

describe("trials", () => {
  test("pause the clock and resume it where it stopped when they fail", () => {
    let s = accuse(fresh(), "a", "b", T0 + 60_000);
    expect(s).toMatchObject({ phase: "accusation", deadlineAt: null, msLeft: 7 * 60_000 });
    s = castVerdict(s, "spy", false, T0 + 200_000);
    s = castVerdict(s, "c", true, T0 + 200_000);
    s = castVerdict(s, "d", true, T0 + 200_000);
    expect(s.phase).toBe("questioning");
    expect(s.deadlineAt).toBe(T0 + 200_000 + 7 * 60_000);
    expect(s.trial?.convicted).toBe(false);
  });

  test("need every juror, and a closed vote counts the missing as not guilty", () => {
    let s = accuse(fresh(), "a", "spy", T0);
    s = castVerdict(s, "b", true, T0);
    s = castVerdict(s, "c", true, T0);
    s = closeTrial(s, true, T0);
    expect(s.phase).toBe("questioning");
    expect(s.trial?.ballots).toContainEqual({ voterId: "d", guilty: false });
  });

  test("allow one accusation each and refuse the accused's vote", () => {
    let s = accuse(fresh(), "a", "b", T0);
    expectRefusal("SELF_VOTE", () => castVerdict(s, "b", false, T0));
    expectRefusal("NOT_HOST", () => closeTrial(s, false, T0));
    s = closeTrial(s, true, T0);
    expectRefusal("ALREADY_DONE", () => accuse(s, "a", "c", T0));
    expectRefusal("SELF_VOTE", () => accuse(s, "c", "c", T0));
  });

  test("a unanimous conviction goes to the guess, naming how it ended", () => {
    expect(convict(fresh(), "a", "spy")).toMatchObject({ phase: "guess", ending: "caught" });
    expect(convict(fresh(), "a", "b")).toMatchObject({ phase: "guess", ending: "framed" });
  });
});

describe("guess and scores", () => {
  test("caught and wrong: the town scores and the accuser scores double", () => {
    let s = convict(fresh(), "a", "spy");
    expectRefusal("NOT_PLAYING", () => guessPlace(s, "a", s.placeId));
    s = guessPlace(s, "spy", wrongPlace(s));
    expect(s.outcome).toBe("caught");
    expect(scoreRound(s)).toEqual({ spy: 0, a: 2, b: 1, c: 1, d: 1 });
  });

  test("caught and right: the Tiktiki escapes with two", () => {
    const s = convict(fresh(), "a", "spy");
    expect(scoreRound(guessPlace(s, "spy", s.placeId))).toEqual({ spy: 2, a: 0, b: 0, c: 0, d: 0 });
  });

  test("the clock running out gives two, or four with the place", () => {
    const s = expireClock(fresh());
    expect(s).toMatchObject({ phase: "guess", ending: "clock" });
    expect(scoreRound(guessPlace(s, "spy", wrongPlace(s))).spy).toBe(2);
    expect(scoreRound(guessPlace(s, "spy", s.placeId)).spy).toBe(4);
  });

  test("framing an innocent gives three, or five with the place", () => {
    const s = convict(fresh(), "a", "b");
    expect(scoreRound(guessPlace(s, "spy", wrongPlace(s)))).toEqual({ spy: 3, a: 0, b: 0, c: 0, d: 0 });
    expect(scoreRound(guessPlace(s, "spy", s.placeId)).spy).toBe(5);
  });

  test("refuses a place that isn't on the table", () => {
    const s = expireClock(fresh());
    const off = PLACE_IDS.find((p) => !s.suspects.includes(p)) as PlaceId;
    expectRefusal("BAD_TARGET", () => guessPlace(s, "spy", off));
  });

  test("an aborted round scores nobody", () => {
    expect(Object.values(scoreRound(abortRound(fresh())))).toEqual([0, 0, 0, 0, 0]);
  });
});

describe("exits", () => {
  test("keep the round going and drop the leaver's vote", () => {
    let s = accuse(fresh(), "a", "b", T0);
    s = castVerdict(s, "c", true, T0);
    s = removePlayer(s, "c");
    expect(s.phase).toBe("accusation");
    expect(s.trial?.votes).not.toHaveProperty("c");
    s = castVerdict(castVerdict(s, "spy", true, T0), "d", true, T0);
    expect(s).toMatchObject({ phase: "guess", ending: "framed" });
  });

  test("a Tiktiki who has left forfeits the guess", () => {
    const s = expireClock(removePlayer(fresh(), "spy"));
    expect(s).toMatchObject({ phase: "over", outcome: "clock", guessId: null });
    expect(scoreRound(s).spy).toBe(2);
  });
});

describe("views", () => {
  test("never leak the place to the Tiktiki or the Tiktiki to the table mid-round", () => {
    const s = fresh();
    const pub = publicRound(s, 1);
    expect(pub.tiktikiId).toBeNull();
    expect(pub.placeId).toBeNull();
    expect(pub.points).toBeNull();
    expect(yourRound(s, "spy")).toEqual({ tiktiki: true, placeId: null, verdict: null });
    expect(yourRound(s, "a").placeId).toBe(s.placeId);
  });

  test("unmask the Tiktiki at the guess and the place at the end", () => {
    const guessing = expireClock(fresh());
    expect(publicRound(guessing, 1)).toMatchObject({ tiktikiId: "spy", placeId: null });
    const over = guessPlace(guessing, "spy", guessing.placeId);
    expect(publicRound(over, 1)).toMatchObject({ placeId: over.placeId, guessId: over.placeId });
  });
});
