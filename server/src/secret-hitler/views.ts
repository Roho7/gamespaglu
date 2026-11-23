import {
  boardFor,
  partyOf,
  type PlayerId,
  type ShPublicRound,
  type ShYourRound,
} from "../../../shared/protocol";
import { isAlive, nightKnowledge, termLimitedNow, vetoUnlocked, type ShState } from "./engine";

/**
 * Everything the table may see: the board, counts, who holds which office and who has voted.
 * Roles appear only once the game is over. The deck, the discards, the hands and the ballots of
 * an open vote never leave the server.
 */
export function publicRound(s: ShState, roundNo: number): ShPublicRound {
  const over = s.phase === "over";
  const limited = termLimitedNow(s);
  return {
    roundNo,
    phase: s.phase,
    roster: s.players.map((id) => ({
      id,
      name: s.names[id],
      alive: isAlive(s, id),
      role: over ? s.roles[id] : null,
      termLimited: limited.includes(id),
      investigated: s.investigations.some((i) => i.target === id),
      notHitler: s.notHitler.includes(id),
      voted: s.phase === "vote" && s.votes[id] !== undefined,
    })),
    board: boardFor(s.players.length),
    liberal: s.liberal,
    fascist: s.fascist,
    tracker: s.tracker,
    deckCount: s.deck.length,
    discardCount: s.discard.length,
    president: s.president,
    chancellor: s.chancellor,
    power: s.power,
    vetoUnlocked: vetoUnlocked(s),
    vetoAsked: s.vetoAsked,
    lastVote: s.lastVote,
    news: s.news,
    outcome: s.outcome,
  };
}

/** What this one player's cards and offices show them. */
export function yourRound(s: ShState, you: PlayerId): ShYourRound {
  const president = s.president === you;
  const chancellor = s.chancellor === you;
  return {
    role: s.roles[you],
    alive: isAlive(s, you),
    knows: nightKnowledge(s, you).map((playerId) => ({ playerId, role: s.roles[playerId] })),
    vote: s.phase === "vote" ? (s.votes[you] ?? null) : null,
    hand:
      (s.phase === "president" && president) || (s.phase === "chancellor" && chancellor)
        ? [...s.hand]
        : null,
    canVeto: s.phase === "chancellor" && chancellor && vetoUnlocked(s) && !s.vetoRefused,
    peek: s.phase === "power" && s.power === "peek" && president ? s.deck.slice(0, 3) : null,
    investigations: s.investigations
      .filter((i) => i.by === you)
      .map((i) => ({ playerId: i.target, party: partyOf(s.roles[i.target]) })),
  };
}
