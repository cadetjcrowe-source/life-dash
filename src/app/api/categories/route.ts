import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { bad, body, handle, ok } from "@/lib/http";
import { categoryInput } from "@/lib/validators";

const { categories: c } = schema;

export const GET = handle(async () => ok(await db().select().from(c).orderBy(asc(c.sortOrder), asc(c.createdAt))));

export const POST = handle(async (req: Request) => {
  const data = await body(req, categoryInput);
  const d = db();
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${c.sortOrder}), -1)` }).from(c);
  const [row] = await d
    .insert(c)
    .values({ ...data, sortOrder: Number(max) + 1 })
    .onConflictDoNothing()
    .returning();
  return row ? ok(row, { status: 201 }) : bad("A category with that name already exists", 409);
});
