import { resolve } from "node:path";
import { config } from "dotenv";

function loadEnv() {
  config();
  config({ path: resolve(process.cwd(), "../.env") });
}
loadEnv();

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var ${name}`);
  }
  return v;
}

const memory = process.env.ROOM_STORE === "memory";
if (memory && process.env.NODE_ENV === "production") {
  throw new Error("ROOM_STORE=memory is for local development only");
}

export const env = {
  memory,
  redisUrl: memory ? "" : required("REDIS_URL"),
  redisToken: memory ? "" : required("REDIS_REST_TOKEN"),
  port: Number(process.env.PORT ?? 8080),
  isProd: process.env.NODE_ENV === "production",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
