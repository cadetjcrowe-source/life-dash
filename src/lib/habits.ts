import type { HabitEntry, Settings } from "@/db/schema";
import { addDays, monthStart, range } from "./dates";

export type Kind = "sleep" | "water" | "creative" | "gym";

export const HABIT_META: Record<Kind, { label: string; emoji: string; color: string; unit: string }> = {
  sleep: { label: "Sleep", emoji: "😴", color: "#7d7aff", unit: "h" },
  water: { label: "Water", emoji: "💧", color: "#4aa8d8", unit: "glasses" },
  creative: { label: "Creative practice", emoji: "🎨", color: "#c77dbb", unit: "min" },
  gym: { label: "Gym", emoji: "💪", color: "#3fae6a", unit: "sessions" },
};

/** Total value for a habit on a given day (gym = number of sessions). */
export function dayValue(entries: HabitEntry[], date: string, kind: Kind): number {
  const list = entries.filter((e) => e.date === date && e.kind === kind);
  if (kind === "gym") return list.length;
  return list.reduce((a, b) => a + b.value, 0);
}

export function target(kind: Kind, s: Settings): number {
  return kind === "sleep" ? s.sleepTarget : kind === "water" ? s.waterTarget : kind === "creative" ? s.creativeTarget : 1;
}

/** Was the habit "hit" that day? Creative counts any practice at all. */
export function isHit(kind: Kind, value: number, s: Settings): boolean {
  if (kind === "creative" || kind === "gym") return value > 0;
  return value >= target(kind, s);
}

/**
 * Consecutive days hit, ending today — or ending yesterday if today isn't
 * done yet, so a streak never looks broken in the middle of the day.
 */
export function streak(entries: HabitEntry[], kind: Kind, s: Settings, today: string): number {
  let d = isHit(kind, dayValue(entries, today, kind), s) ? today : addDays(today, -1);
  let n = 0;
  while (isHit(kind, dayValue(entries, d, kind), s) && n < 400) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function lastNDays(entries: HabitEntry[], kind: Kind, today: string, n = 7) {
  return range(addDays(today, -(n - 1)), n).map((date) => ({ date, value: dayValue(entries, date, kind) }));
}

export function gymThisMonth(entries: HabitEntry[], today: string): number {
  const start = monthStart(today);
  return entries.filter((e) => e.kind === "gym" && e.date >= start && e.date <= today).length;
}

const NUDGES = [
  "Even 15 minutes counts. Fancy a quick session today?",
  "No pressure — a short walk to the gym is a win on its own.",
  "Future you will thank you for one easy session this week.",
  "Start small: one set, one machine, done. That still counts.",
  "Pop your earphones in and go for a gentle one?",
];

/** A friendly nudge (rotates daily). Shown only if no session in the last 3 days. */
export function gymNudge(entries: HabitEntry[], today: string): string | null {
  const recent = entries.some((e) => e.kind === "gym" && e.date >= addDays(today, -2));
  if (recent) return null;
  const idx = Number(today.replaceAll("-", "")) % NUDGES.length;
  return NUDGES[idx];
}

export const CELEBRATIONS = [
  "Session logged — brilliant! 💪",
  "You showed up. That's the hard part. 🎉",
  "Nice one! Every session counts. ✨",
  "Great work — proud of you! 🙌",
];
