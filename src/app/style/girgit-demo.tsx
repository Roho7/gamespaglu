"use client";

import { ClueBoard, type ClueSlip } from "@/components/girgit/clue-board";
import { GirgitGrid } from "@/components/girgit/girgit-grid";

/** The grid as the caught Girgit sees it: every tile tappable. */
export function PickableGridDemo({ cells }: { cells: string[] }) {
  return <GirgitGrid cells={cells} onPick={() => {}} />;
}

/** The clue board during the vote: every slip but yours is tappable. */
export function VotingBoardDemo({ slips }: { slips: ClueSlip[] }) {
  return (
    <ClueBoard slips={slips} onSelect={() => {}} disabledIds={["you"]} />
  );
}
