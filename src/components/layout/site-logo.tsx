import { cn } from "@/lib/utils";

export function SiteLogo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Games Paglu"
      className={cn(
        "block aspect-[394/305] h-11 bg-[var(--on-loud)] [mask:url(/logo/logo-white.png)_center/contain_no-repeat]",
        className,
      )}
    />
  );
}
