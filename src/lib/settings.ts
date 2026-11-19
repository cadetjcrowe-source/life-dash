import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Settings } from "@/db/schema";
import { DEFAULT_SETTINGS } from "./constants";

export async function getSettings(): Promise<Settings> {
  const [row] = await db().select().from(schema.settings).where(eq(schema.settings.id, 1));
  return { ...DEFAULT_SETTINGS, ...(row?.data ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await db()
    .insert(schema.settings)
    .values({ id: 1, data: next })
    .onConflictDoUpdate({ target: schema.settings.id, set: { data: next, updatedAt: new Date() } });
  return next;
}
