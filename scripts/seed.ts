import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import { DEFAULT_SETTINGS } from "../src/lib/constants";
import { today } from "../src/lib/dates";

// Example projects for a brand-new dashboard. Edit, archive or delete them in the app.
const PROJECTS = [
  { name: "My first project", emoji: "🚀", category: "Personal", status: "active", progress: 0, nextAction: "Tap this card to rename it and set a next action" },
  { name: "Something to learn", emoji: "📚", category: "Other", status: "idea", progress: 0, nextAction: "Write down the very first step" },
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  const auto = process.argv.includes("--first-run");
  if (!url) {
    if (auto) return console.warn("⚠︎ DATABASE_URL not set – skipping seed.");
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });

  // On deploys (--first-run) only seed a brand-new database, so projects you
  // delete or rename never come back.
  const alreadySetUp = (await db.select().from(schema.settings).limit(1)).length > 0;
  if (auto && alreadySetUp) {
    await pool.end();
    return console.log("✓ Database already set up – skipping seed");
  }
  await db.insert(schema.settings).values({ id: 1, data: DEFAULT_SETTINGS }).onConflictDoNothing();

  const existing = new Set((await db.select({ name: schema.projects.name }).from(schema.projects)).map((p) => p.name));
  let order = existing.size;
  for (const p of PROJECTS) {
    if (existing.has(p.name)) {
      console.log(`• ${p.name} already exists, skipping`);
      continue;
    }
    const [row] = await db.insert(schema.projects).values({ ...p, sortOrder: order++ }).returning();
    await db.insert(schema.projectSnapshots).values({ projectId: row.id, progress: row.progress, date: today() });
    console.log(`✓ ${p.name}`);
  }
  await pool.end();
  console.log("Seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
