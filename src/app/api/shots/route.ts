import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";
import { shotInput } from "@/lib/validators";

export const GET = handle(async () => ok(await db().select().from(schema.shotIdeas).orderBy(desc(schema.shotIdeas.createdAt))));

export const POST = handle(async (req: Request) => {
  const data = await body(req, shotInput);
  const [row] = await db().insert(schema.shotIdeas).values(data).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
