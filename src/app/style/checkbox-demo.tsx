"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/controls";

/** A live checkbox, since the style page can't hand a server callback to one. */
export function CheckboxDemo() {
  const [checked, setChecked] = useState(true);
  return (
    <Checkbox checked={checked} onCheckedChange={setChecked}>
      {checked ? "Checked" : "Unchecked"}
    </Checkbox>
  );
}
