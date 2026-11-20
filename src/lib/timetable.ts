// College timetable helpers. Lessons are weekly events with kind = "lesson"
// (title = subject, location = room). Shared by the app and the morning push.
import type { CalEvent } from "@/db/schema";
import { addDays, weekStart } from "./dates";
import { occurrences } from "./recurrence";

export type Lesson = CalEvent & { occurrenceDate: string; skipped: boolean };

export const isLesson = (e: CalEvent) => e.kind === "lesson";

/** A lesson's display name: the subject if you've set one, else "Lesson". */
export const subjectOf = (l: Pick<CalEvent, "title">) => (l.title.trim() && l.title !== "Lesson" ? l.title : "Lesson");

/** Lessons between two dates, including skipped weeks (flagged) so they can be restored. */
export function lessonsBetween(events: CalEvent[], from: string, to: string): Lesson[] {
  const out: Lesson[] = [];
  for (const ev of events.filter(isLesson)) {
    const all = occurrences({ ...ev, excludedDates: [] }, from, to);
    for (const d of all) out.push({ ...ev, occurrenceDate: d, skipped: (ev.excludedDates ?? []).includes(d) });
  }
  return out.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate) || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
}

/** Lessons actually happening on a day (skipped weeks removed). */
export const lessonsOn = (events: CalEvent[], date: string) => lessonsBetween(events, date, date).filter((l) => !l.skipped);

export type NextLesson =
  | { state: "now"; lesson: Lesson; minsLeft: number }
  | { state: "next"; lesson: Lesson; minsUntil: number; laterToday: number }
  | { state: "doneToday"; upcoming: Lesson | null; hadToday: number }
  | { state: "free"; upcoming: Lesson | null };

const mins = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

/** What's on now / next today, or the next lesson on a later day. */
export function nextLesson(events: CalEvent[], today: string, nowHM: string): NextLesson {
  const todays = lessonsOn(events, today).filter((l) => l.startTime);
  const now = mins(nowHM);
  const upcoming = lessonsBetween(events, addDays(today, 1), addDays(today, 21)).find((l) => !l.skipped && l.startTime) ?? null;
  if (todays.length === 0) return { state: "free", upcoming };
  const current = todays.find((l) => mins(l.startTime!) <= now && now < mins(l.endTime ?? l.startTime!) );
  if (current) return { state: "now", lesson: current, minsLeft: mins(current.endTime ?? current.startTime!) - now };
  const later = todays.filter((l) => mins(l.startTime!) > now);
  if (later.length) return { state: "next", lesson: later[0], minsUntil: mins(later[0].startTime!) - now, laterToday: later.length - 1 };
  return { state: "doneToday", upcoming, hadToday: todays.length };
}

/** Monday–Friday dates of the week containing `date`. */
export const schoolWeek = (date: string) => Array.from({ length: 5 }, (_, i) => addDays(weekStart(date), i));

export function fmtMins(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}
