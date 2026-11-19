import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { today } from "@/lib/dates";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { projectPatch } from "@/lib/validators";

const { projects, projectSnapshots } = schema;

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, projectPatch);
  const d = db();
  const [row] = await d
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  if (!row) return bad("Not found", 404);
  if (data.progress !== undefined) {
    await d.insert(projectSnapshots).values({ projectId: id, progress: data.progress, date: today() });
  }
  return ok(row);
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  await db().delete(projects).where(eq(projects.id, id));
  return ok({ ok: true });
});
