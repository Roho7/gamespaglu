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
    <div className="flex flex-col gap-[0.85em]">
      <ol className="flex flex-col gap-[0.65em] font-medium">
        <li>1. Everyone gets a secret role. Peek at your card, then keep a straight face.</li>
        <li>2. Night falls. Every phone says the same thing, so nobody can tell who is doing what.</li>
        <li>3. The Mafia whack someone. The Doctor plays hero. Villagers point at whoever looks shifty.</li>
        <li>4. Morning brings the body count, and what they were.</li>
        <li>5. Argue. Lie. Swear on your mother. Then vote someone out, or chicken out.</li>
        <li>6. Catch every crook and the town wins. Let them match your numbers and the Mafia own the place.</li>
      </ol>
      <Link href="/how-to-play/mafia" className="block font-bold underline decoration-2">
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
    <div className="flex flex-col gap-[0.85em]">
      <table className="w-auto max-w-full text-left font-semibold">
        <thead className="mb-caps text-[0.72em]">
          <tr>
            <th className="pr-[0.85em] pb-[0.4em] font-normal">Players</th>
            <th className="pr-[0.85em] pb-[0.4em] font-normal">Mafia</th>
            <th className="pb-[0.4em] font-normal">Doctor</th>
          </tr>
        </thead>
        <tbody>
          {MIX_ROWS.map((r) => (
            <tr key={r.from}>
              <td className="pr-[0.85em] pb-[0.35em]">
                {r.from}–{r.to}
              </td>
              <td className="pr-[0.85em] pb-[0.35em]">{r.mafia}</td>
              <td className="pb-[0.35em]">1</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="opacity-80">Everyone else is a Villager. No powers, all opinions.</p>
    </div>
  );
}

/** The role mix a table of `players` would be dealt, in one line. */
export function mixLine(players: number): string {
  const mix = roleMix(players);
  const villagers = `${mix.villager} ${mix.villager === 1 ? "Villager" : "Villagers"}`;
  return `${mix.mafia} Mafia · Doctor · ${villagers}`;
}
