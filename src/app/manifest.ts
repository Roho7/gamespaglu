import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Games Paglu",
    short_name: "Games Paglu",
    description:
      "Random generators and a scoreboard for games played in person. Works offline.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf7f0",
    theme_color: "#faf7f0",
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
  };
}
