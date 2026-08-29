import { Pool, type PoolClient } from "pg";
import { env } from "./env";

/**
 * Postgres is the source of truth, not a cache of memory. That is what makes
 * "rejoin after closing the app" true rather than a story — and it is why a
 * redeploy costs connections but not games.
 *
 * Session mode (5432), not the transaction pooler: this process is long-lived
 * and takes real transactions with SELECT ... FOR UPDATE.
 */
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: env.isProd ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("[db] idle client error", err);
});

/**
 * Everything that reads-then-writes room state goes through here. The
 * motivating case: two players submitting the last action at the same instant
 * must not both see "everyone is done" and both advance the phase.
 */
export async function withTx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function ping(): Promise<void> {
  await pool.query("select 1");
}
