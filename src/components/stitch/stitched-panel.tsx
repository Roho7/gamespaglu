import { StitchBorder } from "@/components/stitch/stitch-border";
import { cn } from "@/lib/utils";

/**
 * A stitch-framed section of a play surface: an optional poster heading, then
 * a body that scrolls inside the frame rather than pushing the band off screen.
 * Briefing tabs leave the heading off, because the tab is the heading.
 */
export function StitchedPanel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative flex min-h-0 flex-col", className)}>
      <StitchBorder className="inset-0 text-[var(--cw-shadow)]" />
      {title ? <h2 className="mb-display-sm px-7 pt-6 text-4xl text-[var(--cw-highlight)]">{title}</h2> : null}
      <div className={cn("min-h-0 flex-1 overflow-y-auto px-7 pb-6", title ? "pt-3" : "pt-6")}>
        {children}
      </div>
    </section>
  );
}
