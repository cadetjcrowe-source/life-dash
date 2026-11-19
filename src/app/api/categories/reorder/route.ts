import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";

export const POST = handle(async (req: Request) => {
  const { ids } = await body(req, z.object({ ids: z.array(z.uuid()).min(1).max(100) }));
  await db().transaction(async (tx) => {
    for (const [i, id] of ids.entries()) await tx.update(schema.categories).set({ sortOrder: i }).where(eq(schema.categories.id, id));
  });
  return ok({ ok: true });
});
