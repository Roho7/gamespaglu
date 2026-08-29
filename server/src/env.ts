import { config } from "dotenv";
config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    // Fail at boot, loudly. A server that starts without a database and only
    // discovers it when eight people are mid-round is worse than one that
    // refuses to start.
    throw new Error(`Missing required env var ${name}`);
  }
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(process.env.PORT ?? 8080),
  isProd: process.env.NODE_ENV === "production",
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};
