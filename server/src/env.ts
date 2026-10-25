import { resolve } from "node:path";
import { config } from "dotenv";

/** The Next app keeps secrets in the repo-root `.env`. This process is started from `server/`. */
function loadEnv() {
  config();
  config({ path: resolve(process.cwd(), "../.env") });
}
loadEnv();

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Fail at boot, loudly. A server that starts without Redis and only
    // discovers it when eight people are mid-round is worse than one that
    // refuses to start.
    throw new Error(`Missing required env var ${name}`);
  }
  return v;
}

export const env = {
  redisUrl: required("REDIS_URL"),
  redisToken: required("REDIS_REST_TOKEN"),
  port: Number(process.env.PORT ?? 8080),
  isProd: process.env.NODE_ENV === "production",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
