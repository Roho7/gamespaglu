import { colourwayById, colourwayVars } from "@/lib/colourways";
import { cn } from "@/lib/utils";

/**
 * A matchbox label: outer rule in the frame ink, an inner rule inset from it,
 * the field between them, and an optional black band across the bottom for the
 * primary action — straight off the reference.
 *
 * Pass either a colourway id (fixed identity, e.g. a category card) or leave it
 * to inherit the scope's tokens (per-draw recolouring).
 */
export function Label({
  colourway,
  band,
  children,
  className,
  fieldClassName,
  tilt,
}: {
  colourway?: string;
  band?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fieldClassName?: string;
  tilt?: "none" | "left" | "right";
}) {
  const style = colourway
    ? colourwayVars(colourwayById(colourway))
    : undefined;

  return (
    <div
      style={style}
      className={cn(
        "mb-label",
        tilt === "left" && "mb-tilt",
        tilt === "right" && "mb-tilt-alt",
        className,
      )}
    >
      <div className={cn("mb-label-field", fieldClassName)}>{children}</div>
      {band ? <div className="mb-band px-4 py-3">{band}</div> : null}
    </div>
  );
}
