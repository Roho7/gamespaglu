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
  const tried = (who: string, verb: string, t: string | null) =>
    t ? `${who} ${verb} ${nameOf(t)}.` : `${who} never made up their mind.`;
  return (
    <ol className="space-y-3 text-sm">
      {records.map((r, i) => (
        <li key={i} className="space-y-0.5">
          {r.kind === "night" ? (
            <>
              <p className="mb-caps text-[0.6rem] opacity-70">Night {r.night}</p>
              <p className="font-bold">
                {tried("The Mafia", "went after", r.kill)} {tried("The Doctor", "patched up", r.save)}
              </p>
              <p>{r.died ? `${nameOf(r.died)} got whacked.` : "Everyone made it to morning."}</p>
              {r.suspicions.length ? (
                <p className="opacity-80">
                  Villager hunches:{" "}
                  {r.suspicions.map((s) => `${nameOf(s.voterId)} → ${nameOf(s.targetId)}`).join(", ")}
                </p>
              ) : null}
            </>
          ) : r.kind === "vote" ? (
            <>
              <p className="mb-caps text-[0.6rem] opacity-70">Day {r.day} trial</p>
              <p className="font-bold">{r.out ? `${nameOf(r.out)} got the boot.` : "The town bottled it. Nobody went."}</p>
              {r.ballots.length ? (
                <p className="opacity-80">
                  {r.ballots.map((b) => `${nameOf(b.voterId)} → ${target(b.targetId)}`).join(", ")}
                </p>
              ) : null}
            </>
          ) : (
            <p className="font-bold">{nameOf(r.playerId)} walked out mid-game.</p>
          )}
        </li>
      ))}
    </ol>
  );
}
