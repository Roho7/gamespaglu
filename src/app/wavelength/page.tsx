import type { Metadata } from "next";
import { WavelengthScreen } from "@/components/wavelength/wavelength-screen";
import { SITE } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Wavelength — the dial guessing game on one phone",
  description:
    "One clue, one hidden target, one dial. Read your friends' minds on a spectrum between two ends. Two teams or all together, one phone, works offline.",
  alternates: { canonical: `${SITE.url}/wavelength` },
  openGraph: {
    title: "Wavelength — on one phone",
    description: "One clue, one hidden target, one dial. Two or more players around one phone.",
    url: `${SITE.url}/wavelength`,
  },
};

export default function WavelengthPage() {
  return <WavelengthScreen />;
}
