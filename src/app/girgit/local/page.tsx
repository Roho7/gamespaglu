import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalGirgit } from "@/components/girgit/local-girgit";

export const metadata: Metadata = {
  title: "Girgit — local test room",
  robots: { index: false, follow: false },
};

/** A solo Girgit room with bots, for playing the full flow in development. */
export default function LocalGirgitPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LocalGirgit />;
}
