import { InkDither } from "@/components/stitch/ink-dither";

const BAR = "linear-gradient(currentColor, currentColor)";

/**
 * A frame's four rules printed as a moving dither in the frame's ink. One
 * shader fills the frame and a mask cuts it down to the rules, which stop
 * `clear` short of each corner.
 */
export function DitheredRules({ clear }: { clear: string }) {
  const span = `calc(100% - 2 * ${clear})`;
  const rule = "calc(var(--stitch) * 2)";
  const mask = {
    maskImage: [BAR, BAR, BAR, BAR].join(", "),
    maskSize: `${span} ${rule}, ${span} ${rule}, ${rule} ${span}, ${rule} ${span}`,
    maskPosition: "center top, center bottom, left center, right center",
    maskRepeat: "no-repeat",
  };

  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        ...mask,
        WebkitMaskImage: mask.maskImage,
        WebkitMaskSize: mask.maskSize,
        WebkitMaskPosition: mask.maskPosition,
        WebkitMaskRepeat: mask.maskRepeat,
      }}
    >
      <InkDither />
    </div>
  );
}
