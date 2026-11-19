import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, ok, uuid, type Ctx } from "@/lib/http";

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(schema.habitEntries).where(eq(schema.habitEntries.id, id));
  return ok({ ok: true });
});
