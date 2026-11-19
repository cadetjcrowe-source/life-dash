import { desc, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { handle, ok } from "@/lib/http";

const { journalEntries: j } = schema;

// GET /api/journal?q=search
export const GET = handle(async (req: Request) => {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 100);
  const pattern = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
  const rows = await db()
    .select()
    .from(j)
    .where(q ? or(ilike(j.body, pattern), ilike(sql`${j.date}::text`, pattern)) : undefined)
    .orderBy(desc(j.date))
    .limit(q ? 100 : 365);
  return ok(rows);
});
