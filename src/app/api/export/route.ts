import { db, schema } from "@/db";
import { today } from "@/lib/dates";
import { handle } from "@/lib/http";

export const GET = handle(async () => {
  const d = db();
  const [tasks, inbox, events, habits, projects, projectSnapshots, journal, reviews, settings] = await Promise.all([
    d.select().from(schema.tasks),
    d.select().from(schema.inboxItems),
    d.select().from(schema.events),
    d.select().from(schema.habitEntries),
    d.select().from(schema.projects),
    d.select().from(schema.projectSnapshots),
    d.select().from(schema.journalEntries),
    d.select().from(schema.weeklyReviews),
    d.select().from(schema.settings),
  ]);
  const data = {
    app: "Life",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    inbox,
    events,
    habits,
    projects,
    projectSnapshots,
    journal,
    reviews,
    settings,
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="life-backup-${today()}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
