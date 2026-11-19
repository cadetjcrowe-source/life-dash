import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ReviewSummary } from "@/db/schema";
import { addDays } from "./dates";
import { getSettings } from "./settings";

/** Build the automatic summary for the Monday–Sunday week starting `weekStart`. */
export async function buildSummary(weekStart: string): Promise<ReviewSummary> {
  const weekEnd = addDays(weekStart, 6);
  const d = db();
  const { tasks, habitEntries: h, projects, projectSnapshots: ps, journalEntries: j } = schema;

  const [doneTasks, habits, allProjects, snaps, journal, settings] = await Promise.all([
    d
      .select({ category: tasks.category })
      .from(tasks)
      .where(and(eq(tasks.done, true), gte(tasks.completedOn, weekStart), lte(tasks.completedOn, weekEnd))),
    d.select().from(h).where(and(gte(h.date, weekStart), lte(h.date, weekEnd))),
    d.select().from(projects).where(eq(projects.archived, false)).orderBy(asc(projects.sortOrder)),
    d.select().from(ps).where(lte(ps.date, weekEnd)).orderBy(asc(ps.date), asc(ps.createdAt)),
    d.select({ date: j.date }).from(j).where(and(gte(j.date, weekStart), lte(j.date, weekEnd))),
    getSettings(),
  ]);

  const tasksByCategory: Record<string, number> = {};
  for (const t of doneTasks) tasksByCategory[t.category] = (tasksByCategory[t.category] ?? 0) + 1;

  const sleep = habits.filter((e) => e.kind === "sleep");
  const water = habits.filter((e) => e.kind === "water");
  const creative = habits.filter((e) => e.kind === "creative");
  const creativeByType: Record<string, number> = {};
  for (const c of creative) creativeByType[c.subtype ?? "other"] = (creativeByType[c.subtype ?? "other"] ?? 0) + c.value;

  // Progress at start of week = latest snapshot before weekStart; end = latest snapshot ≤ weekEnd.
  const projectRows = allProjects
    .map((p) => {
      const mine = snaps.filter((s) => s.projectId === p.id);
      // Start = last snapshot before the week, or the first one recorded during it (new projects).
      const start = mine.filter((s) => s.date < weekStart).at(-1) ?? mine.find((s) => s.date >= weekStart);
      const end = mine.at(-1);
      return { id: p.id, name: p.name, emoji: p.emoji, from: start?.progress ?? 0, to: end?.progress ?? p.progress };
    })
    .filter((p) => p.to !== p.from);

  return {
    tasksCompleted: doneTasks.length,
    tasksByCategory,
    habits: {
      sleepAvg: sleep.length ? Math.round((sleep.reduce((a, b) => a + b.value, 0) / sleep.length) * 10) / 10 : null,
      sleepDaysHit: sleep.filter((s) => s.value >= settings.sleepTarget).length,
      waterDaysHit: water.filter((w) => w.value >= settings.waterTarget).length,
      creativeDays: new Set(creative.map((c) => c.date)).size,
    },
    creativeMinutes: creative.reduce((a, b) => a + b.value, 0),
    creativeByType,
    gymSessions: habits.filter((e) => e.kind === "gym").length,
    journalDays: journal.length,
    projects: projectRows,
  };
}
