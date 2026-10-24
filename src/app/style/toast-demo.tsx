"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <Button
      variant="secondary"
      onClick={() => toast("That is not a room code.")}
    >
      Show a toast
    </Button>
  );
}
