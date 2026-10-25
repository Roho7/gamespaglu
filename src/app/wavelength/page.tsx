import type { Metadata } from "next";
import { WavelengthScreen } from "@/components/wavelength/wavelength-screen";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Wavelength — the dial guessing game on one phone",
  description:
    "One clue, one hidden target, one dial. Read your friends' minds on a spectrum as One Psychic, One Guesser or two Teams. Two to twelve players, one phone, works with no signal.",
  path: "/wavelength",
  shareTitle: "Wavelength, on one phone",
});

export default function WavelengthPage() {
  return <WavelengthScreen />;
}
