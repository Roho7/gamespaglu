"use client";

import { useState } from "react";
import type { GuideVideo } from "@/content/guides";
import { cn } from "@/lib/utils";

export function TutorialVideo({ video, className }: { video: GuideVideo; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={cn("group", className)}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="mb-caps flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
          ▶
        </span>
        Watch how to play
      </summary>
      {open ? (
        <div className="mx-auto mt-3 aspect-[9/16] w-full max-w-[18rem] border-[length:var(--rule-thin)] border-[var(--cw-shadow)] bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&playsinline=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="size-full"
          />
        </div>
      ) : null}
    </details>
  );
}
