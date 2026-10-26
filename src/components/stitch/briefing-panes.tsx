"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { StitchedPanel } from "@/components/stitch/stitched-panel";
import { cn } from "@/lib/utils";

/** One page of a briefing. The title is the tab. */
export type BriefingPane = {
  id: string;
  title: string;
  body: React.ReactNode;
};

export function BriefingPanes({
  panes,
  initial,
  label = "Briefing",
}: {
  panes: readonly BriefingPane[];
  initial?: string;
  label?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(() =>
    panes.some((pane) => pane.id === initial) && initial ? initial : panes[0].id,
  );
  const pane = panes.find((item) => item.id === active) ?? panes[0];

  const select = (id: string) => {
    setActive(id);
    document.getElementById(`briefing-tab-${id}`)?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        role="tablist"
        aria-label={label}
        className="mr-1 flex gap-2"
        onKeyDown={(event) => {
          const dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
          if (!dir) return;
          event.preventDefault();
          const index = panes.findIndex((item) => item.id === pane.id);
          const next = panes[(index + dir + panes.length) % panes.length];
          select(next.id);
        }}
      >
        {panes.map((item) => {
          const on = item.id === pane.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`briefing-tab-${item.id}`}
              aria-selected={on}
              aria-controls={`briefing-pane-${item.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(item.id)}
              className={cn(
                "relative flex-1 bg-transparent px-2 pt-3 pb-2.5 text-center transition-transform active:translate-y-px cursor-pointer",
                on ? "text-[var(--cw-base)]" : "text-[var(--cw-shadow)]",
              )}
            >
              {on ? (
                <motion.span
                  layoutId="briefing-tab"
                  aria-hidden
                  className="absolute inset-0 bg-[var(--cw-shadow)] shadow-[3px_3px_0_var(--cw-highlight)]"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", duration: 0.35, bounce: 0.2 }
                  }
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0 border-[length:var(--rule-thin)] border-[var(--cw-shadow)] opacity-70"
                />
              )}
              <span className="mb-display-sm relative text-[clamp(1.35rem,6.5vw,1.85rem)] leading-none">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
      <StitchedPanel className="min-h-0 flex-1">
        <motion.div
          key={pane.id}
          id={`briefing-pane-${pane.id}`}
          role="tabpanel"
          aria-labelledby={`briefing-tab-${pane.id}`}
          className="mb-briefing"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {pane.body}
        </motion.div>
      </StitchedPanel>
    </div>
  );
}
