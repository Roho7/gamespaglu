import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  MAFIA_MAX_PLAYERS,
  MAFIA_MIN_PLAYERS,
  roleMix,
  type MafiaFate,
  type MafiaRole,
} from "@shared/protocol";

export const ROLE_LABEL: Record<MafiaRole, string> = {
  mafia: "Mafia",
  doctor: "Doctor",
  detective: "Detective",
  villager: "Villager",
};

export const FATE_LABEL: Record<MafiaFate, string> = {
  killed: "Killed",
  voted: "Voted out",
  left: "Left",
};

/** Mafia's rules in six lines, with the full guide one tap away. */
export function MafiaRules() {
  return (
    <div className="space-y-3">
      <ol className="space-y-3 text-sm font-medium">
        <li>1. Everyone gets a secret role. Hold your card to see it.</li>
        <li>2. At night every phone asks the same thing: choose a player.</li>
        <li>3. The Mafia kill, the Doctor saves, the Detective checks. Villagers pick a hunch.</li>
        <li>4. Morning says who died, and what they were.</li>
        <li>5. Argue out loud, then vote someone out, or no one.</li>
        <li>6. The town wins when the Mafia are gone. The Mafia win when they match the town.</li>
      </ol>
      <Link href="/how-to-play/mafia" className="block text-sm font-bold underline decoration-2">
        Full rules{" "}
        <ArrowRight className="inline size-[1em] align-[-0.125em]" strokeWidth={3} aria-hidden />
      </Link>
    </div>
  );
}

const MIX_ROWS = Array.from(
  { length: MAFIA_MAX_PLAYERS - MAFIA_MIN_PLAYERS + 1 },
  (_, i) => i + MAFIA_MIN_PLAYERS,
).reduce<{ from: number; to: number; mafia: number }[]>((rows, n) => {
  const mafia = roleMix(n).mafia;
  const last = rows.at(-1);
  if (last?.mafia === mafia) last.to = n;
  else rows.push({ from: n, to: n, mafia });
  return rows;
}, []);

/** Who a table is dealt, by headcount. There are no settings: the count decides. */
export function RoleTable() {
  return (
    <div className="space-y-3">
      <table className="w-full text-left text-sm font-semibold">
        <thead className="mb-caps text-[0.6rem]">
          <tr>
            <th className="pb-1 font-normal">Players</th>
            <th className="pb-1 font-normal">Mafia</th>
            <th className="pb-1 font-normal">Doctor</th>
            <th className="pb-1 font-normal">Detective</th>
          </tr>
        </thead>
        <tbody>
          {MIX_ROWS.map((r) => (
            <tr key={r.from}>
              <td>
                {r.from}–{r.to}
              </td>
              <td>{r.mafia}</td>
              <td>1</td>
              <td>1</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[0.7rem] opacity-80">Everyone else is a Villager.</p>
    </div>
  );
}

/** The role mix a table of `players` would be dealt, in one line. */
export function mixLine(players: number): string {
  const mix = roleMix(players);
  const villagers = `${mix.villager} ${mix.villager === 1 ? "Villager" : "Villagers"}`;
  return `${mix.mafia} Mafia · Doctor · Detective · ${villagers}`;
}
