import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { kitItemPatch } from "@/lib/validators";

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, kitItemPatch);
  const [row] = await db().update(schema.kitItems).set(data).where(eq(schema.kitItems.id, id)).returning();
  return row ? ok(row) : bad("Not found", 404);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(schema.kitItems).where(eq(schema.kitItems.id, id));
  return ok({ ok: true });
});
