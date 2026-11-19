import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { addDays, today } from "@/lib/dates";
import { bad, body, handle, ok, ymd } from "@/lib/http";
import { habitInput } from "@/lib/validators";

const { habitEntries: h } = schema;

// GET /api/habits?from=YYYY-MM-DD&to=YYYY-MM-DD (defaults: last 120 days)
export const GET = handle(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const to = ymd.parse(sp.get("to") ?? today());
  const from = ymd.parse(sp.get("from") ?? addDays(to, -120));
  const rows = await db()
    .select()
    .from(h)
    .where(and(gte(h.date, from), lte(h.date, to)))
    .orderBy(asc(h.date), asc(h.createdAt));
  return ok(rows);
});

// Sleep and water are a single value per day (set). Creative and gym append a session.
export const POST = handle(async (req: Request) => {
  const data = await body(req, habitInput);
  const d = db();
  if (data.kind === "sleep" || data.kind === "water") {
    const existing = await d
      .select({ id: h.id })
      .from(h)
      .where(and(eq(h.date, data.date), eq(h.kind, data.kind)))
      .limit(1);
    if (existing[0]) {
      const [row] = await d
        .update(h)
        .set({ value: data.value, updatedAt: new Date() })
        .where(eq(h.id, existing[0].id))
        .returning();
      return ok(row);
    }
  } else if (data.kind === "creative" && !data.subtype) {
    return bad("Creative sessions need a type");
  }
  const [row] = await d.insert(h).values(data).onConflictDoNothing().returning();
  return ok(row ?? null, { status: 201 });
});
