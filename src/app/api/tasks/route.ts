import { and, desc, eq, gte, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { addDays, today } from "@/lib/dates";
import { body, handle, ok } from "@/lib/http";
import { taskInput } from "@/lib/validators";

const { tasks } = schema;

// Open tasks + anything completed in the last 14 days.
export const GET = handle(async () => {
  const since = addDays(today(), -14);
  const rows = await db()
    .select()
    .from(tasks)
    .where(or(eq(tasks.done, false), and(eq(tasks.done, true), gte(tasks.completedOn, since))))
    .orderBy(desc(tasks.createdAt));
  return ok(rows);
});

export const POST = handle(async (req: Request) => {
  const data = await body(req, taskInput);
  const [row] = await db().insert(tasks).values(data).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
