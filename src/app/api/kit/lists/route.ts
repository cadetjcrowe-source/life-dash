import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";
import { kitListInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  const data = await body(req, kitListInput);
  const d = db();
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${schema.kitLists.sortOrder}), -1)` }).from(schema.kitLists);
  const [row] = await d.insert(schema.kitLists).values({ ...data, sortOrder: Number(max) + 1 }).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
