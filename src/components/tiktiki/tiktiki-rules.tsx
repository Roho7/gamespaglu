import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SCORE_ACCUSER, SCORE_RIGHT_GUESS, SCORE_TOWN, TIKTIKI_BASE_SCORE } from "@shared/protocol";

/** Tiktiki's rules in six lines, with the full guide one tap away. */
export function TiktikiRules() {
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ol className="flex flex-col gap-[0.65em] font-medium">
        <li>1. Everyone is given a location. Hold to peek at the place. One of you just sees a lizard: the Tiktiki.</li>
        <li>2. Take turns asking anyone a question about the place. Whoever answers asks next. No asking back.</li>
        <li>3. Too vague and you look like the Tiktiki. Too obvious and the Tiktiki works out where you are.</li>
        <li>4. Think you&apos;ve spotted them? Accuse. Everyone else votes, and it has to be unanimous.</li>
        <li>5. However the round ends, the Tiktiki gets one guess at the place.</li>
        <li>6. Catch them and they guess wrong, the table scores. Anything else, the lizard does.</li>
      </ol>
      <Link href="/how-to-play/tiktiki" className="block font-bold underline decoration-2">
        Full rules <ArrowRight className="inline size-[1em] align-[-0.125em]" strokeWidth={3} aria-hidden />
      </Link>
    </div>
  );
}

/** Who scores what, by how the round ended. */
export function ScoreTable() {
  const rows = [
    ["Caught, wrong guess", "0", `${SCORE_TOWN} each, accuser ${SCORE_ACCUSER}`],
    ["Caught, right guess", String(TIKTIKI_BASE_SCORE.caught + SCORE_RIGHT_GUESS), "0"],
    ["Clock runs out", `${TIKTIKI_BASE_SCORE.clock}, or ${TIKTIKI_BASE_SCORE.clock + SCORE_RIGHT_GUESS}`, "0"],
    ["Innocent convicted", `${TIKTIKI_BASE_SCORE.framed}, or ${TIKTIKI_BASE_SCORE.framed + SCORE_RIGHT_GUESS}`, "0"],
  ];
  return (
    <div className="flex flex-col gap-[0.85em]">
      <table className="w-auto max-w-full text-left font-semibold">
        <thead className="mb-caps text-[0.72em]">
          <tr>
            <th className="pr-[0.85em] pb-[0.4em] font-normal">Ending</th>
            <th className="pr-[0.85em] pb-[0.4em] font-normal">Tiktiki</th>
            <th className="pb-[0.4em] font-normal">Table</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([ending, tiktiki, table]) => (
            <tr key={ending} className="align-top">
              <td className="pr-[0.85em] pb-[0.4em]">{ending}</td>
              <td className="pr-[0.85em] pb-[0.4em]">{tiktiki}</td>
              <td className="pb-[0.4em]">{table}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="opacity-80">The bigger number is for naming the place on the guess.</p>
    </div>
  );
}
