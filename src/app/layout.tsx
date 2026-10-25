import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import { SITE } from "@/lib/site-config";
import { ServiceWorkerRegistration } from "@/components/layout/service-worker-registration";
import { PaletteGrain } from "@/components/artwork/palette-grain";
import { Toaster } from "@/components/ui/sonner";
import { HomeSlideMemory } from "@/components/home/home-rail";
import { PageTransition } from "@/components/layout/page-transition";
import { ditherTransitionCss } from "@/lib/dither-transition";
import { GROUND, paletteCss, theme } from "@/lib/palettes";
import "./globals.css";

/**
 * Poster type: Bebas Neue for display, a condensed all-caps face, and Montserrat
 * for everything else. Self-hosted by next/font at build time, so the PWA
 * never fetches a font at runtime.
 */
const poster = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-poster",
  display: "swap",
});

const body = Montserrat({
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
  themeColor: GROUND.shadow,
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
    <html
      lang="en"
      {...theme(GROUND, { flipped: true })}
      className={`${poster.variable} ${body.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
        <style dangerouslySetInnerHTML={{ __html: ditherTransitionCss() }} />
      </head>
      <body className="flex min-h-full flex-col">
        <PaletteGrain
          palette={GROUND}
          tone="ink"
          className="fixed inset-0 -z-10"
        />
        <HomeSlideMemory />
        <PageTransition>{children}</PageTransition>
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
