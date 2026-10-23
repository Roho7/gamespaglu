import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Oswald } from "next/font/google";
import { SITE } from "@/lib/site-config";
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration";
import "./globals.css";

/**
 * Poster type: Bebas Neue for display, a condensed all-caps face, and Oswald
 * for everything else. Self-hosted by next/font at build time, so the PWA
 * never fetches a font at runtime.
 */
const poster = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster",
  display: "swap",
});

const body = Oswald({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Games Paglu — party games your phone helps you play",
    template: "%s · Games Paglu",
  },
  description:
    "Random generators and a scoreboard for games played in person. Play Who Am I? with celebrities, movies, places, animals, objects or numbers. Works offline, no signup.",
  applicationName: SITE.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    title: "Games Paglu — party games your phone helps you play",
    description:
      "Who Am I?, six random generators and a universal scoreboard. For games played in a room with people.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f2b23e", // check-tokens-ignore: browser chrome needs a literal
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poster.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
