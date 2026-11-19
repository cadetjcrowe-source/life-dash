import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { handle, ok } from "@/lib/http";
import { productivityLevel, type PixelDay } from "@/lib/pixels";
import { getSettings } from "@/lib/settings";

// GET /api/pixels?year=2026 – one summary per day that has any data.
export const GET = handle(async (req: Request) => {
  const year = z.coerce.number().int().min(2000).max(2100).parse(new URL(req.url).searchParams.get("year"));
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const d = db();
  const { journalEntries: j, tasks: t, habitEntries: h } = schema;
  const [journal, done, habits, settings] = await Promise.all([
    d.select({ date: j.date, mood: j.mood, body: j.body }).from(j).where(and(gte(j.date, from), lte(j.date, to))),
    d.select({ date: t.completedOn }).from(t).where(and(eq(t.done, true), gte(t.completedOn, from), lte(t.completedOn, to))),
    d.select({ date: h.date, kind: h.kind, value: h.value }).from(h).where(and(gte(h.date, from), lte(h.date, to))),
    getSettings(),
  ]);

  const days: Record<string, PixelDay> = {};
  const day = (date: string) =>
    (days[date] ??= { mood: null, tasks: 0, water: 0, sleep: 0, creative: 0, gym: 0, hasJournal: false, score: 0 });
  for (const e of journal) Object.assign(day(e.date), { mood: e.mood, hasJournal: e.body.trim().length > 0 });
  for (const e of done) if (e.date) day(e.date).tasks++;
  for (const e of habits) {
    const x = day(e.date);
    if (e.kind === "gym") x.gym++;
    else if (e.kind === "water" || e.kind === "sleep" || e.kind === "creative") x[e.kind] += e.value;
  }
  for (const x of Object.values(days)) x.score = productivityLevel(x, { water: settings.waterTarget, sleep: settings.sleepTarget });
  return ok({ year, days });
});
