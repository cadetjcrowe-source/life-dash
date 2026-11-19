import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, ok } from "@/lib/http";

export const GET = handle(async () => {
  const d = db();
  const [lists, items] = await Promise.all([
    d.select().from(schema.kitLists).orderBy(asc(schema.kitLists.sortOrder), asc(schema.kitLists.createdAt)),
    d.select().from(schema.kitItems).orderBy(asc(schema.kitItems.sortOrder), asc(schema.kitItems.createdAt)),
  ]);
  return ok({ lists, items });
});
