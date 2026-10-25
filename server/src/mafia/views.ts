import {
  roleMix,
  type MafiaNightRecord,
  type MafiaPublicRound,
  type MafiaPublicVote,
  type MafiaVoteRecord,
  type MafiaYourRound,
  type PlayerId,
} from "../../../shared/protocol";
import {
  isAlive,
  living,
  livingWith,
  nightOutstanding,
  voteOutstanding,
  type MafiaState,
} from "./engine";

const tonight = (state: MafiaState) =>
  state.records.find(
    (r): r is MafiaNightRecord => r.kind === "night" && r.night === state.night,
  ) ?? null;

const today = (state: MafiaState) =>
  state.records.find(
    (r): r is MafiaVoteRecord => r.kind === "vote" && r.day === state.night,
  ) ?? null;

function publicVote(state: MafiaState): MafiaPublicVote | null {
  const total = living(state).length;
  if (state.phase === "vote") {
    const votedBy = state.players.filter((p) => state.votes[p]);
    return { open: true, votesIn: votedBy.length, total, votedBy, result: null };
  }
  const result = state.phase === "night" ? null : today(state);
  if (!result) return null;
  const votedBy = result.ballots.map((b) => b.voterId);
  return { open: false, votesIn: votedBy.length, total, votedBy, result };
}

/**
 * Everything the table may see. A role is public once its player is out, and every role and every
 * night's choices once the game is over. Nothing else about the night ever leaves the server.
 */
export function publicRound(state: MafiaState, roundNo: number): MafiaPublicRound {
  const over = state.phase === "over";
  const night = state.phase === "night" ? null : tonight(state);
  return {
    roundNo,
    night: state.night,
    roster: state.players.map((id) => ({
      id,
      name: state.names[id],
      alive: !state.fates[id],
      role: over || state.fates[id] ? state.roles[id] : null,
      fate: state.fates[id] ?? null,
    })),
    mix: roleMix(state.players.length),
    waitingOn:
      state.phase === "night"
        ? nightOutstanding(state).length
        : state.phase === "vote"
          ? voteOutstanding(state).length
          : 0,
    news: night ? { night: night.night, died: night.died } : null,
    vote: publicVote(state),
    outcome: state.outcome,
    replay: over ? state.records : null,
  };
}

/** What only this player may see, and only inside the hold-to-reveal card. */
export function yourRound(state: MafiaState, playerId: PlayerId): MafiaYourRound {
  const role = state.roles[playerId];
  const alive = isAlive(state, playerId);
  const team =
    role === "mafia"
      ? state.players.filter((p) => p !== playerId && state.roles[p] === "mafia")
      : [];
  return {
    role,
    alive,
    team,
    teamPicks:
      role === "mafia" && alive && state.phase === "night"
        ? livingWith(state, "mafia")
            .filter((p) => p !== playerId)
            .map((p) => ({ playerId: p, targetId: state.picks[p] ?? null }))
        : [],
    pick: state.phase === "night" ? (state.picks[playerId] ?? null) : null,
    vote: state.phase === "vote" ? (state.votes[playerId] ?? null) : null,
    checks: role === "detective" ? state.checks : [],
    lastSave: role === "doctor" ? state.lastSave : null,
  };
}
