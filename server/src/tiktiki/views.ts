import type {
  PlayerId,
  TiktikiPublicRound,
  TiktikiTrial,
  TiktikiYourRound,
} from "../../../shared/protocol";
import { jurors, scoreRound, type TiktikiState } from "./engine";

function publicTrial(state: TiktikiState): TiktikiTrial | null {
  const trial = state.trial;
  if (!trial) return null;
  const open = state.phase === "accusation";
  return {
    accuserId: trial.accuserId,
    accusedId: trial.accusedId,
    votedBy: Object.keys(trial.votes),
    total: open ? jurors(state).length : (trial.ballots?.length ?? 0),
    ballots: open ? null : trial.ballots,
    convicted: open ? null : trial.convicted,
  };
}

/**
 * Everything the table may see. Who the Tiktiki is becomes public once the questioning is over;
 * the place, only once the round is.
 */
export function publicRound(state: TiktikiState, roundNo: number): TiktikiPublicRound {
  const over = state.phase === "over";
  const unmasked = over || state.phase === "guess";
  return {
    roundNo,
    roster: state.players.map((id) => ({ id, name: state.names[id], present: !state.gone.includes(id) })),
    suspects: state.suspects,
    firstAskerId: state.firstAskerId,
    roundMs: state.roundMs,
    deadlineAt: state.deadlineAt,
    msLeft: state.msLeft,
    accusers: state.accusers,
    trial: publicTrial(state),
    ending: state.ending,
    tiktikiId: unmasked ? state.tiktikiId : null,
    placeId: over ? state.placeId : null,
    guessId: over ? state.guessId : null,
    outcome: state.outcome,
    points: over ? scoreRound(state) : null,
  };
}

/** What only this player may see, and only inside the hold-to-reveal card. */
export function yourRound(state: TiktikiState, playerId: PlayerId): TiktikiYourRound {
  const tiktiki = playerId === state.tiktikiId;
  const vote = state.phase === "accusation" ? state.trial?.votes[playerId] : undefined;
  return {
    tiktiki,
    placeId: tiktiki ? null : state.placeId,
    verdict: vote ?? null,
  };
}
