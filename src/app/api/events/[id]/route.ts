import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { eventPatch } from "@/lib/validators";

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, eventPatch);
  const [row] = await db()
    .update(schema.events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.events.id, id))
    .returning();
  return row ? ok(row) : bad("Not found", 404);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(schema.events).where(eq(schema.events.id, id));
  return ok({ ok: true });
});
