import type { CalEvent } from "@/db/schema";
import { addDays, addMonths, diffDays } from "./dates";

export type Occurrence = CalEvent & { occurrenceDate: string };

/** Expand an event into every occurrence that falls within [from, to] (inclusive). */
export function occurrences(ev: CalEvent, from: string, to: string): string[] {
  const out: string[] = [];
  const until = ev.repeatUntil && ev.repeatUntil < to ? ev.repeatUntil : to;
  const excluded = new Set(ev.excludedDates ?? []);
  const push = (d: string) => {
    if (d >= from && d <= until && !excluded.has(d)) out.push(d);
  };

  if (ev.repeat === "none") {
    push(ev.date);
    return out;
  }
  if (ev.date > until) return out;

  if (ev.repeat === "monthly") {
    // Jump close to `from`, then step month by month.
    let i = 0;
    let d = ev.date;
    while (d < from && i < 1200) d = addMonths(ev.date, ++i);
    while (d <= until && i < 1200) {
      push(d);
      d = addMonths(ev.date, ++i);
    }
    return out;
  }

  const step = ev.repeat === "daily" ? 1 : ev.repeat === "weekly" ? 7 : 14;
  let start = ev.date;
  if (start < from) {
    const skip = Math.ceil(diffDays(start, from) / step);
    start = addDays(start, skip * step);
  }
  for (let d = start; d <= until; d = addDays(d, step)) push(d);
  return out;
}

export function expandEvents(evs: CalEvent[], from: string, to: string): Occurrence[] {
  const list: Occurrence[] = [];
  for (const ev of evs) for (const d of occurrences(ev, from, to)) list.push({ ...ev, occurrenceDate: d });
  return list.sort(
    (a, b) =>
      a.occurrenceDate.localeCompare(b.occurrenceDate) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? "") ||
      a.title.localeCompare(b.title),
  );
}
