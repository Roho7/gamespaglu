import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalMafia } from "@/components/mafia/local-mafia";

export const metadata: Metadata = {
  title: "Mafia — local test room",
  robots: { index: false, follow: false },
};

/** A solo Mafia room with bots, for playing the full flow in development. */
export default function LocalMafiaPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LocalMafia />;
}
