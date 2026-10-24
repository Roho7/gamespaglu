import type { RoundState } from "./engine";
import type {
  PlayerId,
  PublicRound,
  RoomPhase,
  YourRound,
} from "../../../shared/protocol";

/** Everything the room may see. The secret appears only at the reveal. */
export function publicRound(state: RoundState, roundNo: number): PublicRound {
  const revealed = state.phase === "reveal";
  const votesResolved = !state.voteOpen;

  const voteCounts: Record<string, number> = {};
  for (const p of state.players) voteCounts[p] = 0;
  for (const target of Object.values(state.votes)) voteCounts[target] += 1;

  return {
    roundNo,
    theme: state.theme,
    cells: state.cells,
    cluesIn: Object.keys(state.clues).length,
    cluesTotal: state.players.length,
    // Live, in submission order-independent player order, so the board fills up
    // in front of the table instead of appearing all at once at the end.
    clues: state.players
      .filter((p) => state.clues[p])
      .map((p) => ({ playerId: p, word: state.clues[p] })),
    votedBy: state.players.filter((p) => state.votes[p]),
    // Counts, not targets: the table can watch the vote build without learning
    // who put it there until it resolves.
    voteCounts,
    deadlineAt: state.deadlineAt,
    skipped: state.skipped ?? [],
    voteOpen: state.voteOpen,
    votesIn: Object.keys(state.votes).length,
    votes: votesResolved
      ? Object.entries(state.votes).map(([voterId, targetId]) => ({ voterId, targetId }))
      : null,
    accused: state.accused,
    outcome: state.outcome,
    girgitId: revealed ? state.girgit : null,
    secretIndex: revealed ? state.secretIndex : null,
    escapeGuess: revealed ? state.escapeGuess : null,
  };
}

/** The half that differs per recipient. */
export function yourRound(state: RoundState, playerId: PlayerId): YourRound {
  const isGirgit = playerId === state.girgit;
  return {
    isGirgit,
    secretIndex: isGirgit ? null : state.secretIndex,
    hasClued: Boolean(state.clues[playerId]),
    hasVoted: Boolean(state.votes[playerId]),
  };
}

export const phaseOf = (state: RoundState | null): RoomPhase => state?.phase ?? "lobby";
