"use client";

import { useState } from "react";
import { EraPicker, TypePicker } from "@/components/game/filters";
import { ALL_TYPES } from "@/lib/celeb-types";
import { filterPool } from "@/lib/draw";
import { availableTypes } from "@/lib/entries";
import type { EraFilter, TypeKey } from "@/lib/types";

/**
 * Live on /style, because the house rule is that a component doesn't exist
 * until it appears there. Doubles as a sanity check that the offered chips and
 * the resulting deck size always agree.
 */
export function CelebFilterDemo() {
  const [types, setTypes] = useState<TypeKey[]>([...ALL_TYPES]);
  const [era, setEra] = useState<EraFilter>("both");

  const offered = availableTypes("celebrity", { era });
  const size = filterPool("celebrity", {
    countries: ["in", "us"],
    types,
    era,
  }).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="mb-caps text-[0.6rem] opacity-60">Who counts</p>
        <TypePicker
          types={types}
          onTypes={(next) => setTypes(next)}
          available={offered}
        />
      </div>
      <div className="space-y-2">
        <p className="mb-caps text-[0.6rem] opacity-60">Era</p>
        <EraPicker era={era} onEra={setEra} />
      </div>
      <p className="mb-caps text-[0.6rem] opacity-60">
        {size} in the deck · India + USA
      </p>
    </div>
  );
}
