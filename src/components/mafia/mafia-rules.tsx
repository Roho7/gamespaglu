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
  villager: "Villager",
};

export const FATE_LABEL: Record<MafiaFate, string> = {
  killed: "Whacked",
  voted: "Exiled",
  left: "Walked out",
};

/** Mafia's rules in six lines, with the full guide one tap away. */
export function MafiaRules() {
  return (
    <div className="space-y-3">
      <ol className="space-y-3 text-sm font-medium">
        <li>1. Everyone gets a secret role. Peek at your card, then keep a straight face.</li>
        <li>2. Night falls. Every phone says the same thing, so nobody can tell who is doing what.</li>
        <li>3. The Mafia whack someone. The Doctor plays hero. Villagers point at whoever looks shifty.</li>
        <li>4. Morning brings the body count, and what they were.</li>
        <li>5. Argue. Lie. Swear on your mother. Then vote someone out, or chicken out.</li>
        <li>6. Catch every crook and the town wins. Let them match your numbers and the Mafia own the place.</li>
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
        <thead className="mb-caps text-sm">
          <tr>
            <th className="pb-1 font-normal">Players</th>
            <th className="pb-1 font-normal">Mafia</th>
            <th className="pb-1 font-normal">Doctor</th>
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
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm opacity-80">Everyone else is a Villager. No powers, all opinions.</p>
    </div>
  );
}

/** The role mix a table of `players` would be dealt, in one line. */
export function mixLine(players: number): string {
  const mix = roleMix(players);
  const villagers = `${mix.villager} ${mix.villager === 1 ? "Villager" : "Villagers"}`;
  return `${mix.mafia} Mafia · Doctor · ${villagers}`;
}
