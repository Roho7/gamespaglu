import Link from "next/link";
import { CATEGORIES } from "@/lib/deck/categories";
import type { CategoryId } from "@/lib/deck/types";

const LINK = "mb-caps text-[0.65rem] underline decoration-2 underline-offset-4";

export function HowToPlay({
  category,
  isGame,
  about,
}: {
  category: CategoryId;
  isGame: boolean;
  about?: React.ReactNode;
}) {
  const { noun } = CATEGORIES[category];

  return (
    <div className="space-y-4">
      {isGame ? (
        <ol className="space-y-2 text-base font-medium leading-snug">
          <li>1. Everyone opens this screen on their own phone.</li>
          <li>
            2. Hit Generate. You get three seconds to turn the phone sideways
            and hold it to your forehead, screen out.
          </li>
          <li>
            3. Everyone else sees your {noun}. You don&apos;t. Ask yes-or-no
            questions until you get it.
          </li>
          <li>4. Got it? Regenerate for the next one.</li>
        </ol>
      ) : null}
      {about}
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/how-to-play/who-am-i" className={LINK}>
          Full rules
        </Link>
        <Link href="/scoreboard" className={LINK}>
          Scorecard
        </Link>
        <Link href="/" className={LINK}>
          All categories
        </Link>
      </nav>
    </div>
  );
}
