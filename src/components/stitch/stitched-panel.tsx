import { StitchBorder } from "@/components/stitch/stitch-border";
import { cn } from "@/lib/utils";

/**
 * A stitch-framed section of a play surface: poster heading, then a body that
 * scrolls inside the frame rather than pushing the band off screen.
 */
export function StitchedPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative flex min-h-0 flex-col", className)}>
      <StitchBorder className="inset-0 text-[var(--cw-shadow)]" />
      <h2 className="mb-display-sm px-7 pt-6 text-4xl">{title}</h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-7 pt-3 pb-6">
        {children}
      </div>
    </section>
  );
}
