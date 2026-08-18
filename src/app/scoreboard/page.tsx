import type { Metadata } from "next";
import { AppBar } from "@/components/app-bar";
import { Scoreboard } from "@/components/scoreboard/scoreboard";

export const metadata: Metadata = {
  title: "Scoreboard",
  description:
    "A free scoreboard for any game played in person — cards, carrom, board games, antakshari. Add players or teams, tap to score, undo mistakes. Works offline.",
};

export default function ScoreboardPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <AppBar back="/" title="Scorecard" />
      <div className="px-4 pb-10">
        <Scoreboard />
      </div>
    </main>
  );
}
