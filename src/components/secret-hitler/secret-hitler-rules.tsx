import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SH_MAX_PLAYERS, SH_MIN_PLAYERS, shRoleMix } from "@shared/protocol";

export function SecretHitlerRules() {
  return (
    <div className="flex flex-col gap-[0.85em]">
      <ol className="flex flex-col gap-[0.65em] font-medium">
        <li>1. Everyone gets a secret role on their own phone. Liberals are the majority. Nobody knows who anybody is, except the Fascists.</li>
        <li>2. Each round the President nominates a Chancellor, and everyone votes Ja or Nein. Votes flip together.</li>
        <li>3. Elected? The President gets three policies, bins one and passes two. The Chancellor bins one and enacts the other.</li>
        <li>4. Nobody sees the discards. Lie about them if you like.</li>
        <li>5. Fascist policies hand the President powers: investigate, peek, pick the next President, or shoot someone.</li>
        <li>6. Three failed votes in a row and the top policy passes on its own.</li>
        <li>7. Liberals win with five Liberal policies or a dead Hitler. Fascists win with six Fascist policies, or by electing Hitler Chancellor once three are down.</li>
      </ol>
      <p className="text-sm opacity-80">
        Secret Hitler is by Mike Boxleiter, Tommy Maranges and Mac Schubert, under{" "}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" className="underline decoration-2" target="_blank" rel="noreferrer">
          CC BY-NC-SA 4.0
        </a>
        . Adapted here for one phone per player.
      </p>
      <Link href="/how-to-play/secret-hitler" className="block font-bold underline decoration-2">
        Full rules <ArrowRight className="inline size-[1em] align-[-0.125em]" strokeWidth={3} aria-hidden />
      </Link>
    </div>
  );
}

export function ShRoleTable() {
  const sizes = Array.from({ length: SH_MAX_PLAYERS - SH_MIN_PLAYERS + 1 }, (_, i) => SH_MIN_PLAYERS + i);
  return (
    <table className="w-full text-left font-medium">
      <thead className="mb-caps text-sm">
        <tr>
          <th className="py-1">Players</th>
          <th>Liberals</th>
          <th>Fascists</th>
        </tr>
      </thead>
      <tbody>
        {sizes.map((n) => {
          const mix = shRoleMix(n);
          return (
            <tr key={n} className="border-t-[length:var(--rule-thin)] border-current/30">
              <td className="mb-display-sm py-1 text-xl">{n}</td>
              <td>{mix.liberal}</td>
              <td>{mix.fascist} + Hitler</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function shMixLine(players: number): string {
  const mix = shRoleMix(players);
  return `${mix.liberal} Liberals · ${mix.fascist} ${mix.fascist === 1 ? "Fascist" : "Fascists"} · Hitler`;
}
