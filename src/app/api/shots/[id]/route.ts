import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { today } from "@/lib/dates";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { shotPatch } from "@/lib/validators";

const { shotIdeas: s } = schema;

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, shotPatch);
  const extra = data.shot === undefined ? {} : { shotOn: data.shot ? today() : null };
  const [row] = await db().update(s).set({ ...data, ...extra, updatedAt: new Date() }).where(eq(s.id, id)).returning();
  return row ? ok(row) : bad("Not found", 404);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(s).where(eq(s.id, id));
  return ok({ ok: true });
});
