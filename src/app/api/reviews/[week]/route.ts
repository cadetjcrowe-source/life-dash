import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { weekStart } from "@/lib/dates";
import { body, handle, ok, ymd, type Ctx } from "@/lib/http";
import { buildSummary } from "@/lib/review";
import { reviewInput } from "@/lib/validators";

const { weeklyReviews: r } = schema;

// Returns the saved review (if any) plus a freshly calculated summary.
export const GET = handle(async (_req: Request, { params }: Ctx<"week">) => {
  const week = weekStart(ymd.parse((await params).week));
  const [[saved], live] = await Promise.all([
    db().select().from(r).where(eq(r.weekStart, week)),
    buildSummary(week),
  ]);
  return ok({ weekStart: week, saved: saved ?? null, live });
});

// Saving always refreshes the stored summary.
export const PUT = handle(async (req: Request, { params }: Ctx<"week">) => {
  const week = weekStart(ymd.parse((await params).week));
  const data = await body(req, reviewInput);
  const summary = await buildSummary(week);
  const [row] = await db()
    .insert(r)
    .values({ weekStart: week, summary, ...data })
    .onConflictDoUpdate({ target: r.weekStart, set: { summary, ...data, updatedAt: new Date() } })
    .returning();
  return ok(row);
});
