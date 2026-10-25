import type { MafiaRole } from "@shared/protocol";
import { cn } from "@/lib/utils";

type Shapes = (main: string, detail: string) => React.ReactNode;

const SHAPES: Record<MafiaRole, Shapes> = {
  mafia: (main, detail) => (
    <>
      <ellipse cx="60" cy="78" rx="52" ry="12" fill={main} />
      <path d="M30 76 C30 40 36 26 60 26 C84 26 90 40 90 76 Z" fill={main} />
      <path d="M48 28 Q60 40 72 28" stroke={detail} strokeWidth="5" fill="none" />
      <rect x="30" y="62" width="60" height="9" fill={detail} />
    </>
  ),
  doctor: (main, detail) => (
    <>
      <circle cx="60" cy="60" r="46" fill={main} />
      <rect x="51" y="30" width="18" height="60" fill={detail} />
      <rect x="30" y="51" width="60" height="18" fill={detail} />
    </>
  ),
  villager: (main, detail) => (
    <>
      <path d="M12 56 L60 16 L108 56 Z" fill={main} />
      <rect x="22" y="54" width="76" height="52" fill={main} />
      <rect x="50" y="72" width="20" height="34" fill={detail} />
      <rect x="30" y="64" width="14" height="14" fill={detail} />
      <rect x="76" y="64" width="14" height="14" fill={detail} />
    </>
  ),
};


export function RoleEmblem({ role, className }: { role: MafiaRole; className?: string }) {
  const draw = SHAPES[role];
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={cn("overflow-visible", className)}>
      <g transform="translate(5 5)">{draw("var(--shadow-ink)", "var(--shadow-ink)")}</g>
      {draw("var(--loud)", "var(--on-loud)")}
    </svg>
  );
}
