import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";
import { kitItemInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  const data = await body(req, kitItemInput);
  const d = db();
  const [{ max }] = await d
    .select({ max: sql<number>`coalesce(max(${schema.kitItems.sortOrder}), -1)` })
    .from(schema.kitItems)
    .where(eq(schema.kitItems.listId, data.listId));
  const [row] = await d.insert(schema.kitItems).values({ ...data, sortOrder: Number(max) + 1 }).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
