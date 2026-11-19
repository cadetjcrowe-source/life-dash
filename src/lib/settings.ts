import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Settings } from "@/db/schema";
import { withDefaults } from "./constants";

export async function getSettings(): Promise<Settings> {
  const [row] = await db().select().from(schema.settings).where(eq(schema.settings.id, 1));
  return withDefaults(row?.data);
}

type SettingsPatch = Omit<Partial<Settings>, "features"> & { features?: Partial<Settings["features"]> };

/**
 * Merge a patch into the stored settings atomically in Postgres (jsonb `||`),
 * so the cron job and edits from another device never overwrite each other.
 */
export async function saveSettings(patch: SettingsPatch): Promise<Settings> {
  const { features, ...rest } = patch;
  const cur = await getSettings();
  const full = { ...cur, ...rest, features: { ...cur.features, ...(features ?? {}) } };
  const restJson = JSON.stringify(rest);
  const featJson = JSON.stringify(features ?? {});
  await db()
    .insert(schema.settings)
    .values({ id: 1, data: full })
    .onConflictDoUpdate({
      target: schema.settings.id,
      set: {
        data: sql`${schema.settings.data} || ${restJson}::jsonb || jsonb_build_object('features', coalesce(${schema.settings.data} -> 'features', '{}'::jsonb) || ${featJson}::jsonb)`,
        updatedAt: new Date(),
      },
    });
  return getSettings();
}
