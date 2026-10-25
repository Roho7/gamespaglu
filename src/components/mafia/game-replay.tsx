import { NO_ONE, type MafiaRecord, type VoteTarget } from "@shared/protocol";

/** Every night and vote of a finished game, with what each role chose. */
export function GameReplay({
  records,
  nameOf,
}: {
  records: MafiaRecord[];
  nameOf: (id: string) => string;
}) {
  const target = (t: VoteTarget | null) => (t === null ? "nobody" : t === NO_ONE ? "No one" : nameOf(t));
  return (
    <ol className="space-y-3 text-sm">
      {records.map((r, i) => (
        <li key={i} className="space-y-0.5">
          {r.kind === "night" ? (
            <>
              <p className="mb-caps text-[0.6rem] opacity-70">Night {r.night}</p>
              <p className="font-bold">
                Mafia went for {target(r.kill)}. Doctor saved {target(r.save)}. Detective checked{" "}
                {target(r.check)}.
              </p>
              <p>{r.died ? `${nameOf(r.died)} died.` : "Nobody died."}</p>
              {r.suspicions.length ? (
                <p className="opacity-80">
                  Hunches: {r.suspicions.map((s) => `${nameOf(s.voterId)} → ${nameOf(s.targetId)}`).join(", ")}
                </p>
              ) : null}
            </>
          ) : r.kind === "vote" ? (
            <>
              <p className="mb-caps text-[0.6rem] opacity-70">Day {r.day} vote</p>
              <p className="font-bold">{r.out ? `${nameOf(r.out)} went out.` : "Nobody went out."}</p>
              {r.ballots.length ? (
                <p className="opacity-80">
                  {r.ballots.map((b) => `${nameOf(b.voterId)} → ${target(b.targetId)}`).join(", ")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="font-bold">{nameOf(r.playerId)} left.</p>
          )}
        </li>
      ))}
    </ol>
  );
}
