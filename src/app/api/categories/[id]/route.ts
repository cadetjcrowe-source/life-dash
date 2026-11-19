import { and, asc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { bad, body, handle, ok, uuid, type Ctx } from "@/lib/http";
import { categoryPatch } from "@/lib/validators";

const { categories: c, tasks, events, projects } = schema;

// Rename/recolour. A rename is applied to every task, event and project using it.
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const data = await body(req, categoryPatch);
  return db().transaction(async (tx) => {
    const [cur] = await tx.select().from(c).where(eq(c.id, id));
    if (!cur) return bad("Not found", 404);
    if (data.name && data.name !== cur.name) {
      const [clash] = await tx.select().from(c).where(and(eq(c.name, data.name), ne(c.id, id)));
      if (clash) return bad("A category with that name already exists", 409);
      await tx.update(tasks).set({ category: data.name }).where(eq(tasks.category, cur.name));
      await tx.update(events).set({ category: data.name }).where(eq(events.category, cur.name));
      await tx.update(projects).set({ category: data.name }).where(eq(projects.category, cur.name));
    }
    const [row] = await tx.update(c).set(data).where(eq(c.id, id)).returning();
    return ok(row);
  });
});

// Delete: anything using it moves to ?moveTo=<name> (default: the first other category).
export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const id = uuid.parse((await params).id);
  const moveToParam = new URL(req.url).searchParams.get("moveTo");
  return db().transaction(async (tx) => {
    const [cur] = await tx.select().from(c).where(eq(c.id, id));
    if (!cur) return bad("Not found", 404);
    const others = await tx.select().from(c).where(ne(c.id, id)).orderBy(asc(c.sortOrder));
    if (others.length === 0) return bad("You need at least one category");
    const target = others.find((o) => o.name === moveToParam) ?? others.find((o) => o.name === "Other") ?? others[0];
    await tx.update(tasks).set({ category: target.name }).where(eq(tasks.category, cur.name));
    await tx.update(events).set({ category: target.name }).where(eq(events.category, cur.name));
    await tx.update(projects).set({ category: target.name }).where(eq(projects.category, cur.name));
    await tx.delete(c).where(eq(c.id, id));
    return ok({ ok: true, movedTo: target.name });
  });
});
