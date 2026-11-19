import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { taskInput } from "@/lib/validators";

const { inboxItems, tasks } = schema;

/** Turn an inbox item into a task (atomically). */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, taskInput);
  const created = await db().transaction(async (tx) => {
    const [row] = await tx.insert(tasks).values(data).onConflictDoNothing().returning();
    await tx.delete(inboxItems).where(eq(inboxItems.id, id));
    return row ?? null;
  });
  return ok(created, { status: 201 });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(inboxItems).where(eq(inboxItems.id, id));
  return ok({ ok: true });
});
