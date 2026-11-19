import type { Task } from "@/db/schema";
import { addDays, weekStart } from "./dates";

export type Bucket = "overdue" | "today" | "week" | "later";

export function bucketOf(t: Task, today: string): Bucket {
  if (!t.dueDate) return "later";
  if (t.dueDate < today) return "overdue";
  if (t.dueDate === today) return "today";
  const sunday = addDays(weekStart(today), 6);
  // "This week" = rest of this week, or the next 7 days if today is late in the week.
  const horizon = sunday > addDays(today, 6) ? sunday : addDays(today, 6);
  return t.dueDate <= horizon ? "week" : "later";
}

export function sortTasks(a: Task, b: Task): number {
  return (
    Number(b.pinned) - Number(a.pinned) ||
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
    b.priority - a.priority ||
    a.createdAt.toString().localeCompare(b.createdAt.toString())
  );
}

/** Top 3 for today: pinned first, then overdue/today by priority, then soonest. */
export function topThree(tasks: Task[], today: string): Task[] {
  const open = tasks.filter((t) => !t.done);
  const score = (t: Task) =>
    (t.pinned ? 1000 : 0) +
    (t.dueDate && t.dueDate < today ? 300 : 0) +
    (t.dueDate === today ? 200 : 0) +
    (t.dueDate && t.dueDate <= addDays(today, 2) ? 50 : 0) +
    t.priority * 20;
  return [...open].sort((a, b) => score(b) - score(a) || sortTasks(a, b)).slice(0, 3);
}
