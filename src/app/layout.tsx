import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import { SITE } from "@/lib/site";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const body = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Single weight, brutally heavy. The reveal screen is the product,
// so the display face is the design.
const display = Archivo_Black({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f4" },
    { media: "(prefers-color-scheme: dark)", color: "#14161d" },
  ],
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
      className={`${body.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
