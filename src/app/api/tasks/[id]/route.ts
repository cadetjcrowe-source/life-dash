import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { today } from "@/lib/dates";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { taskPatch } from "@/lib/validators";

const { tasks } = schema;

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, taskPatch);
  const extra = data.done === undefined ? {} : { completedOn: data.done ? today() : null };
  const [row] = await db()
    .update(tasks)
    .set({ ...data, ...extra, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  return row ? ok(row) : bad("Not found", 404);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(tasks).where(eq(tasks.id, id));
  return ok({ ok: true });
});
