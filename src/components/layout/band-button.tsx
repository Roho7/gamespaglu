import { StitchBorder } from "@/components/stitch/stitch-border";
import { cn } from "@/lib/utils";

/**
 * The primary action of a play surface: a stitched band button set in display
 * type, pinned under the field. Sits in a flex row; `flex-1` by default, so two
 * share the band evenly.
 */
export function BandButton({
  children,
  onClick,
  disabled,
  detail,
  className = "flex-1",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** A caps line under the label, e.g. why it is disabled. */
  detail?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("mb-band-action py-10", className)}
    >
      <StitchBorder className="inset-3" />
      <span className="mb-display-sm inline-flex items-center gap-2 text-4xl">
        {children}
      </span>
      {detail ? <span className="mb-caps text-[0.6rem]">{detail}</span> : null}
    </button>
  );
}
