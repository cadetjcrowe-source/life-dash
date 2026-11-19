import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok, ymd, type Ctx } from "@/lib/http";
import { journalInput } from "@/lib/validators";

const { journalEntries: j } = schema;

export const GET = handle(async (_req: Request, { params }: Ctx<"date">) => {
  const date = ymd.parse((await params).date);
  const [row] = await db().select().from(j).where(eq(j.date, date));
  return ok(row ?? null);
});

export const PUT = handle(async (req: Request, { params }: Ctx<"date">) => {
  const date = ymd.parse((await params).date);
  const data = await body(req, journalInput);
  const [row] = await db()
    .insert(j)
    .values({ date, ...data })
    .onConflictDoUpdate({ target: j.date, set: { ...data, updatedAt: new Date() } })
    .returning();
  return ok(row);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx<"date">) => {
  const date = ymd.parse((await params).date);
  await db().delete(j).where(eq(j.date, date));
  return ok({ ok: true });
});
