import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { today } from "@/lib/dates";
import { body, handle, ok } from "@/lib/http";
import { projectInput } from "@/lib/validators";

const { projects, projectSnapshots } = schema;

export const GET = handle(async () => {
  return ok(await db().select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.createdAt)));
});

export const POST = handle(async (req: Request) => {
  const data = await body(req, projectInput);
  const d = db();
  const [{ max }] = await d.select({ max: sql<number>`coalesce(max(${projects.sortOrder}), 0)` }).from(projects);
  const [row] = await d
    .insert(projects)
    .values({ ...data, sortOrder: Number(max) + 1 })
    .onConflictDoNothing()
    .returning();
  if (row) await d.insert(projectSnapshots).values({ projectId: row.id, progress: row.progress, date: today() });
  return ok(row ?? null, { status: 201 });
});
