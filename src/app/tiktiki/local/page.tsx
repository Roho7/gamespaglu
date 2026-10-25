import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalTiktiki } from "@/components/tiktiki/local-tiktiki";

export const metadata: Metadata = {
  title: "Tiktiki — local test room",
  robots: { index: false, follow: false },
};

/** A solo Tiktiki room with bots, for playing the full flow in development. */
export default function LocalTiktikiPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LocalTiktiki />;
}
