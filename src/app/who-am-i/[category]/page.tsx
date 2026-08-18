import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhoAmIGame } from "@/components/game/who-am-i-game";
import { CATEGORIES, CATEGORY_ORDER, isCategoryId } from "@/lib/categories";

export function generateStaticParams() {
  return CATEGORY_ORDER.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategoryId(category)) return {};
  const meta = CATEGORIES[category];
  return {
    title: `Who Am I? — ${meta.label}`,
    description: `Play Who Am I? with a random ${meta.noun}. ${meta.blurb}`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategoryId(category)) notFound();
  return <WhoAmIGame category={category} />;
}
