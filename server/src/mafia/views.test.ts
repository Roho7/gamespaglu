import { describe, expect, test } from "vitest";
import { NO_ONE, type MafiaRole, type PlayerId } from "../../../shared/protocol";
import { seats, seeded } from "../test/helpers";
import {
  abortGame,
  callVote,
  castVote,
  dealMafia,
  fallNight,
  pickAtNight,
  removePlayer,
  type MafiaState,
} from "./engine";
import { publicRound, yourRound } from "./views";

const ROLES: Record<PlayerId, MafiaRole> = {
  m1: "mafia",
  m2: "mafia",
  doc: "doctor",
  v0: "villager",
  v1: "villager",
  v2: "villager",
  v3: "villager",
};
const IDS = Object.keys(ROLES);

const fresh = (): MafiaState => ({ ...dealMafia(seats(IDS), seeded(1)), roles: { ...ROLES } });

function picks(s: MafiaState, all: Record<PlayerId, PlayerId>): MafiaState {
  for (const [by, target] of Object.entries(all)) s = pickAtNight(s, by, target);
  return s;
}

const FIRST_NIGHT = { m1: "v1", m2: "v1", doc: "v2", v0: "m1", v1: "m2", v2: "m2", v3: "m2" };

/** One state per phase of a game, so every view rule is checked at every point a player can be. */
function everyPhase(): MafiaState[] {
  const night1 = picks(fresh(), { m1: "v1", m2: "v2", v0: "m1" });
  const day1 = picks(fresh(), FIRST_NIGHT);
  const vote1 = castVote(castVote(callVote(day1, "v2"), "m1", "v2"), "doc", "m1");
  let verdict1 = vote1;
  for (const [by, target] of [["m2", "v2"], ["v0", "m1"], ["v2", "m1"], ["v3", "m1"]] as const) {
    verdict1 = castVote(verdict1, by, target);
  }
  const night2 = picks(fallNight(verdict1, "v2"), { m2: "v0" });
  return [night1, day1, vote1, verdict1, night2];
}

describe("public view", () => {
  test("never names a living player's role while the game runs", () => {
    for (const s of everyPhase()) {
      for (const p of publicRound(s, 1).roster) {
        if (p.alive) expect(p.role).toBeNull();
        else expect(p.role).toBe(ROLES[p.id]);
      }
    }
  });

  test("never carries the night's choices while the game runs", () => {
    for (const s of everyPhase()) {
      const json = JSON.stringify(publicRound(s, 1));
      for (const secret of ['"kill"', '"save"', '"suspicions"', '"picks"']) {
        expect(json).not.toContain(secret);
      }
      expect(publicRound(s, 1).replay).toBeNull();
    }
  });

  test("names the dead with their role and how they went", () => {
    const view = publicRound(picks(fresh(), FIRST_NIGHT), 1);
    expect(view.roster.find((p) => p.id === "v1")).toEqual({
      id: "v1",
      name: "v1",
      alive: false,
      role: "villager",
      fate: "killed",
    });
    expect(view.news).toEqual({ night: 1, died: "v1" });
  });

  test("still names a player who left, with their role", () => {
    const named = { ...fresh(), names: { ...fresh().names, v3: "Bunty" } };
    const view = publicRound(removePlayer(named, "v3"), 1);
    expect(view.roster.find((p) => p.id === "v3")).toMatchObject({ name: "Bunty", role: "villager", fate: "left" });
  });

  test("carries no news during the night", () => {
    const [night1, , , , night2] = everyPhase();
    expect(publicRound(night1, 1).news).toBeNull();
    expect(publicRound(night2, 1).news).toBeNull();
  });

  test("counts who the night waits on, Mafia included until they agree", () => {
    const [night1] = everyPhase();
    expect(publicRound(night1, 1).waitingOn).toBe(6);
  });

  test("shows who has voted but not how, until the vote closes", () => {
    const [, , vote1, verdict1] = everyPhase();
    expect(publicRound(vote1, 1).vote).toEqual({
      open: true,
      votesIn: 2,
      total: 6,
      votedBy: ["m1", "doc"],
      result: null,
    });
    const closed = publicRound(verdict1, 1).vote;
    expect(closed?.open).toBe(false);
    expect(closed?.result?.out).toBe("m1");
    expect(closed?.result?.ballots).toHaveLength(6);
  });

  test("has no vote before one is called", () => {
    const [, day1] = everyPhase();
    expect(publicRound(day1, 1).vote).toBeNull();
  });

  test("reveals every role and the full replay once the game is over", () => {
    const over = abortGame(picks(fresh(), FIRST_NIGHT));
    const view = publicRound(over, 1);
    expect(view.roster.map((p) => p.role)).toEqual(IDS.map((id) => ROLES[id]));
    expect(view.replay).toEqual(over.records);
    expect(view.outcome).toBe("aborted");
  });

  test("reports the role mix the table was dealt", () => {
    expect(publicRound(fresh(), 1).mix).toEqual({ mafia: 2, doctor: 1, villager: 4 });
  });
});

describe("private view", () => {
  test("shows only Mafia their team, and nobody else anyone's role", () => {
    for (const s of everyPhase()) {
      for (const id of IDS) {
        const you = yourRound(s, id);
        expect(you.role).toBe(ROLES[id]);
        expect(you.team).toEqual(ROLES[id] === "mafia" ? IDS.filter((p) => p !== id && ROLES[p] === "mafia") : []);
      }
    }
  });

  test("shows a living Mafia their teammates' picks, at night only", () => {
    const [night1, day1] = everyPhase();
    expect(yourRound(night1, "m1").teamPicks).toEqual([{ playerId: "m2", targetId: "v2" }]);
    expect(yourRound(night1, "v0").teamPicks).toEqual([]);
    expect(yourRound(day1, "m1").teamPicks).toEqual([]);
  });

  test("stops showing a Mafia who is out their team's picks", () => {
    const [, , , , night2] = everyPhase();
    expect(yourRound(night2, "m1").alive).toBe(false);
    expect(yourRound(night2, "m1").teamPicks).toEqual([]);
  });

  test("gives the Doctor their last save and nobody else", () => {
    const day1 = picks(fresh(), FIRST_NIGHT);
    expect(yourRound(day1, "doc").lastSave).toBe("v2");
    for (const id of IDS.filter((p) => p !== "doc")) expect(yourRound(day1, id).lastSave).toBeNull();
  });

  test("echoes your own pick and vote back to you", () => {
    const [night1, , vote1] = everyPhase();
    expect(yourRound(night1, "m1").pick).toBe("v1");
    expect(yourRound(night1, "v1").pick).toBeNull();
    expect(yourRound(vote1, "doc").vote).toBe("m1");
    expect(yourRound(castVote(vote1, "v3", NO_ONE), "v3").vote).toBe(NO_ONE);
  });
});
