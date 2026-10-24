import type { Metadata } from "next";
import { PageCorners } from "@/components/layout/page-corners";
import { Scoreboard } from "@/components/scoreboard/scoreboard";

export const metadata: Metadata = {
  title: "Scoreboard",
  description:
    "A free scoreboard for any game played in person — cards, carrom, board games, antakshari. Add players or teams, tap to score, undo mistakes. Works offline.",
};

export default function ScoreboardPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 pt-20">
      <PageCorners back="/" scoreboard={false} />
      <div className="space-y-4 px-4 pb-10">
        <h1 className="mb-display text-4xl">Scoreboard</h1>
        <Scoreboard />
      </div>
    </main>
  );
}
