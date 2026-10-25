import type { Metadata } from "next";
import { SITE } from "@/lib/site-config";

/**
 * Metadata for one page, with the site-wide Open Graph and Twitter fields
 * filled in. Next replaces a parent's `openGraph` wholesale rather than merging
 * it, so a page that sets its own title would otherwise drop `siteName`,
 * `type` and `locale`. The share image comes from the route's
 * `opengraph-image.tsx`.
 */
export function pageMetadata({
  title,
  description,
  path,
  shareTitle = title,
  shareDescription = description,
}: {
  title: string;
  description: string;
  path: string;
  shareTitle?: string;
  shareDescription?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: SITE.locale,
      url: path,
      title: shareTitle,
      description: shareDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
    },
  };
}
