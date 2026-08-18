import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lock file in the home directory
  // otherwise makes Turbopack guess wrong.
  turbopack: { root: __dirname },
};

export default nextConfig;
