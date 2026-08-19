import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lock file in the home directory
  // otherwise makes Turbopack guess wrong.
  turbopack: { root: __dirname },

  // Testing on a real phone means loading the dev server over the LAN, and
  // Next blocks cross-origin dev resources by default — the HTML renders but
  // every JS chunk is refused, so the page looks fine and nothing is clickable.
  // Dev-only; production builds are unaffected.
  allowedDevOrigins: [
    "192.168.0.4",
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
    "*.local",
  ],
};

export default nextConfig;
