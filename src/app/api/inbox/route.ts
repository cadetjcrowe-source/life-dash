import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";
import { inboxInput } from "@/lib/validators";

export const GET = handle(async () => {
  return ok(await db().select().from(schema.inboxItems).orderBy(desc(schema.inboxItems.createdAt)));
});

export const POST = handle(async (req: Request) => {
  const data = await body(req, inboxInput);
  const [row] = await db().insert(schema.inboxItems).values(data).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
