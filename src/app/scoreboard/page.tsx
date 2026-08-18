import type { Metadata } from "next";
import { TopBar } from "@/components/brutal";
import { MuteToggle } from "@/components/mute-toggle";
import { Scoreboard } from "@/components/scoreboard/scoreboard";

export const metadata: Metadata = {
  title: "Scoreboard",
  description:
    "A free scoreboard for any game played in person — cards, carrom, board games, antakshari. Add players or teams, tap to score, undo mistakes. Works offline.",
};

export default function ScoreboardPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <TopBar back="/" title="Scoreboard" right={<MuteToggle />} />
      <div className="px-4 pb-10">
        <Scoreboard />
      </div>
    </main>
  );
}
