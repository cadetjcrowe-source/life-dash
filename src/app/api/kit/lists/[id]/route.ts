import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { kitListInput } from "@/lib/validators";

const { kitLists, kitItems } = schema;

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, kitListInput.omit({ id: true }).partial());
  const [row] = await db().update(kitLists).set(data).where(eq(kitLists.id, id)).returning();
  return row ? ok(row) : bad("Not found", 404);
});

// POST { action: "reset" } – untick every item in the list.
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await body(req, z.object({ action: z.literal("reset") }));
  await db().update(kitItems).set({ checked: false }).where(eq(kitItems.listId, id));
  return ok({ ok: true });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(kitLists).where(eq(kitLists.id, id));
  return ok({ ok: true });
});
