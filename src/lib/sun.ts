// Sunrise / sunset / golden hour for Ramsey, using suncalc. Shared by the
// Today card (client) and the morning notification (server).
import * as SunCalc from "suncalc";
import { RAMSEY } from "./constants";
import { TZ, addDays } from "./dates";

export type Window = { kind: "morning" | "evening"; start: Date; end: Date };
export type SunDay = {
  date: string;
  sunrise: Date | null;
  sunset: Date | null;
  windows: Window[]; // morning: sunrise → golden hour ends; evening: golden hour starts → sunset
};

const valid = (d: Date | null | undefined): Date | null => (d instanceof Date && !Number.isNaN(d.getTime()) ? d : null);

export function sunDay(ymd: string): SunDay {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = SunCalc.getTimes(new Date(Date.UTC(y, m - 1, d, 12)), RAMSEY.lat, RAMSEY.lon);
  const sunrise = valid(t.sunrise);
  const sunset = valid(t.sunset);
  const morningEnd = valid(t.goldenHourEnd);
  const eveningStart = valid(t.goldenHour);
  const windows: Window[] = [];
  if (sunrise && morningEnd && morningEnd > sunrise) windows.push({ kind: "morning", start: sunrise, end: morningEnd });
  if (eveningStart && sunset && sunset > eveningStart) windows.push({ kind: "evening", start: eveningStart, end: sunset });
  return { date: ymd, sunrise, sunset, windows };
}

export type GoldenStatus =
  | { state: "now"; window: Window; msLeft: number }
  | { state: "next"; window: Window; msUntil: number }
  | { state: "none" };

/** What's happening now, or the next golden hour (looks ahead to tomorrow). */
export function goldenStatus(today: string, now: Date = new Date()): GoldenStatus {
  const windows = [...sunDay(today).windows, ...sunDay(addDays(today, 1)).windows];
  const current = windows.find((w) => w.start <= now && now < w.end);
  if (current) return { state: "now", window: current, msLeft: current.end.getTime() - now.getTime() };
  const next = windows.find((w) => w.start > now);
  return next ? { state: "next", window: next, msUntil: next.start.getTime() - now.getTime() } : { state: "none" };
}

const hm = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const fmtTime = (d: Date | null) => (d ? hm.format(d) : "–");

export function fmtDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
