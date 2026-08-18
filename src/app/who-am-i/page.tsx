import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/brutal";
import { CATEGORY_LIST } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Who Am I? — pick a category",
  description:
    "Play Who Am I? (also called Heads Up, Celebrity Head or the name-on-forehead game). Pick celebrities, movies, places, animals, objects or numbers.",
};

export default function WhoAmIIndex() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <TopBar back="/" title="Who Am I?" />
      <div className="px-4 pb-8">
        <p className="text-sm font-bold opacity-70">
          Everyone opens this on their own phone. Generate, stick it on your
          forehead, and let the others answer your questions. Pick what you want
          to be.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-3">
          {CATEGORY_LIST.map((c) => (
            <li key={c.id}>
              <Link href={`/who-am-i/${c.id}`} className="block">
                <div
                  className="brutal press flex h-32 flex-col justify-between p-3 text-[var(--on-accent)]"
                  style={{ background: `var(${c.accentVar})` }}
                >
                  <span className="text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <span className="display text-xl leading-none">
                    {c.label}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs font-bold opacity-50">
          Known elsewhere as Heads Up, Hedbanz, Celebrity Head, or — with
          numbers — Indian Poker.
        </p>
      </div>
    </main>
  );
}
