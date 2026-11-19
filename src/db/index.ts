import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

let _db: NodePgDatabase<typeof schema> | null = null;

/**
 * Lazily-created Drizzle client (so builds work without DATABASE_URL).
 * Works with Neon's pooled connection string on Vercel and with any local Postgres.
 */
export function db() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const local = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 5_000,
      ssl: local || url.includes("sslmode=disable") ? undefined : { rejectUnauthorized: true },
    });
    // Lets Vercel close idle connections cleanly before a function is suspended.
    attachDatabasePool(pool);
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };
