import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("⚠︎ DATABASE_URL not set – skipping migrations.");
    return;
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  console.log("Running migrations…");
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("✓ Migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
