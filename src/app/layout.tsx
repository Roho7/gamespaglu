import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

/**
 * Cabinet Grotesk (Indian Type Foundry, Fontshare Free Font License) — one
 * variable file covering body and display. Softer and rounder than Archivo
 * Black, with a wide weight axis, so the heavy display cuts and the body text
 * come from the same family.
 */
const cabinet = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-body",
  weight: "100 900",
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
  themeColor: "#d9c49b", // check-tokens-ignore: browser chrome needs a literal
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
      className={`${cabinet.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
