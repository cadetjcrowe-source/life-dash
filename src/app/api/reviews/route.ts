import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, ok } from "@/lib/http";

export const GET = handle(async () => {
  return ok(await db().select().from(schema.weeklyReviews).orderBy(desc(schema.weeklyReviews.weekStart)));
});
