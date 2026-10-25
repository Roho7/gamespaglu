import type { Metadata } from "next";
import { PageCorners } from "@/components/layout/page-corners";
import { Scoreboard } from "@/components/scoreboard/scoreboard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Scoreboard — keep score for any game",
  description:
    "A free scoreboard for any game played in person: cards, carrom, board games, antakshari. Add players or teams, tap to score, undo mistakes. Works offline.",
  path: "/scoreboard",
});

export default function ScoreboardPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 pt-20">
      <PageCorners scoreboard={false} />
      <div className="space-y-4 px-4 pb-10">
        <h1 className="mb-display text-4xl">Scoreboard</h1>
        <Scoreboard />
      </div>
    </main>
  );
}
