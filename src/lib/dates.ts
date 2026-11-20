// All "today" logic runs in your time zone (Europe/London unless NEXT_PUBLIC_TIME_ZONE is set). Calendar days are handled as
// "YYYY-MM-DD" strings; arithmetic is done on UTC-midnight dates so it is
// immune to DST and device timezone.

import { TIME_ZONE } from "./profile";

export const TZ = TIME_ZONE;

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hmFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Today's date in London as YYYY-MM-DD. */
export function today(now: Date = new Date()): string {
  return ymdFmt.format(now);
}

/** Current London time as HH:MM. */
export function nowTime(now: Date = new Date()): string {
  return hmFmt.format(now);
}

export function londonHour(now: Date = new Date()): number {
  return Number(nowTime(now).slice(0, 2));
}

/** Convert an instant to its London calendar date. */
export function toLondonDate(d: Date | string): string {
  return ymdFmt.format(typeof d === "string" ? new Date(d) : d);
}

function parse(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(ymd: string, n: number): string {
  const d = parse(ymd);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function addMonths(ymd: string, n: number): string {
  const d = parse(ymd);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fmt(d);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(ymd: string): number {
  return parse(ymd).getUTCDay();
}

/** Days from a to b (b − a). */
export function diffDays(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

/** Monday of the week containing ymd. */
export function weekStart(ymd: string): string {
  const wd = weekday(ymd);
  return addDays(ymd, wd === 0 ? -6 : 1 - wd);
}

export function monthStart(ymd: string): string {
  return ymd.slice(0, 8) + "01";
}

export function range(from: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(from, i));
}

const longFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});
const shortFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});
const dayMonthFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
const wdShortFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" });
const monthYearFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });

export const formatLong = (ymd: string) => longFmt.format(parse(ymd));
export const formatShort = (ymd: string) => shortFmt.format(parse(ymd));
export const formatDayMonth = (ymd: string) => dayMonthFmt.format(parse(ymd));
export const formatWeekdayShort = (ymd: string) => wdShortFmt.format(parse(ymd));
export const formatMonthYear = (ymd: string) => monthYearFmt.format(parse(ymd));

/** "Today", "Tomorrow", "Yesterday", "Mon 3 Nov" … */
export function relativeDay(ymd: string, ref: string = today()): string {
  const d = diffDays(ref, ymd);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 1 && d < 7) return longFmt.format(parse(ymd)).split(" ")[0];
  return formatShort(ymd);
}

export function greeting(now: Date = new Date()): string {
  const h = londonHour(now);
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function isYmd(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
