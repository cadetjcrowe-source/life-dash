import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/db/schema";
import { DEFAULT_SETTINGS } from "../src/lib/constants";
import { today } from "../src/lib/dates";

const PROJECTS = [
  { name: "Northminster", emoji: "🏰", category: "Roblox dev", status: "active", progress: 10, nextAction: "Write down the core game loop" },
  { name: "Westbridge", emoji: "🌉", category: "Roblox dev", status: "active", progress: 10, nextAction: "Block out the main map" },
  { name: "Music production: first house track", emoji: "🎧", category: "Music", status: "active", progress: 5, nextAction: "Make a 4-bar drum loop at 124 BPM" },
  { name: "College media club", emoji: "🎬", category: "College", status: "idea", progress: 0, nextAction: "Talk to a tutor about starting it" },
  { name: "Drone permissions (IOM CAA)", emoji: "🛩️", category: "Personal", status: "active", progress: 0, nextAction: "Check the IOM CAA requirements for my drone" },
  { name: "Job search", emoji: "💼", category: "Personal", status: "active", progress: 0, nextAction: "Update my CV" },
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });

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
