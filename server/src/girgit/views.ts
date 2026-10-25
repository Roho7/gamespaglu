import type {
  GirgitPublicRound,
  GirgitYourRound,
  PlayerId,
} from "../../../shared/protocol";
import { tally, type RoundState } from "./engine";

/** Everything the room may see. The secret and the Girgit appear only at the reveal. */
export function publicRound(state: RoundState, roundNo: number): GirgitPublicRound {
  const revealed = state.phase === "reveal";
  return {
    roundNo,
    theme: state.theme,
    cells: state.cells,
    cluesIn: Object.keys(state.clues).length,
    cluesTotal: state.players.length,
    clues: state.players
      .filter((p) => state.clues[p])
      .map((p) => ({ playerId: p, word: state.clues[p] })),
    votedBy: state.players.filter((p) => state.votes[p]),
    voteCounts: tally(state),
    deadlineAt: state.deadlineAt,
    skipped: state.skipped,
    voteOpen: state.voteOpen,
    votesIn: Object.keys(state.votes).length,
    votes: state.voteOpen
      ? null
      : Object.entries(state.votes).map(([voterId, targetId]) => ({ voterId, targetId })),
    accused: state.accused,
    outcome: state.outcome,
    girgitId: revealed ? state.girgit : null,
    secretIndex: revealed ? state.secretIndex : null,
    escapeGuess: revealed ? state.escapeGuess : null,
  };
}

export function yourRound(state: RoundState, playerId: PlayerId): GirgitYourRound {
  const isGirgit = playerId === state.girgit;
  return {
    isGirgit,
    secretIndex: isGirgit ? null : state.secretIndex,
    hasClued: Boolean(state.clues[playerId]),
    hasVoted: Boolean(state.votes[playerId]),
  };
}
