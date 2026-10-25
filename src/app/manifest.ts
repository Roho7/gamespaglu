import type { MetadataRoute } from "next";
import { GROUND } from "@/lib/palettes";
import { SITE } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    lang: "en",
    categories: ["games", "entertainment"],
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: GROUND.shadow,
    theme_color: GROUND.shadow,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Mafia", url: "/mafia/new" },
      { name: "Girgit", url: "/girgit/new" },
      { name: "Tiktiki", url: "/tiktiki/new" },
      { name: "Wavelength", url: "/wavelength" },
      { name: "Who Am I?", url: "/who-am-i" },
    ],
  };
}
