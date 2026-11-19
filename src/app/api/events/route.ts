import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";
import { eventInput } from "@/lib/validators";

// The event list is small (personal calendar), so we return every event and
// expand repeats on the client for whichever range is being viewed.
export const GET = handle(async () => {
  return ok(await db().select().from(schema.events).orderBy(asc(schema.events.date)));
});

export const POST = handle(async (req: Request) => {
  const data = await body(req, eventInput);
  const [row] = await db().insert(schema.events).values(data).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
