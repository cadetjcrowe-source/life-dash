"use client";

import { useState } from "react";
import { HabitDay, WeekBars, useHabitData } from "@/components/habits";
import { Card, CardTitle, NumericText, PageHeader, Skeleton, cx } from "@/components/ui";
import { saveSettings } from "@/lib/actions";
import { CREATIVE_TYPES } from "@/lib/constants";
import { addDays, formatWeekdayShort, monthStart, range, relativeDay } from "@/lib/dates";
import { HABIT_META, gymThisMonth, isHit, lastNDays, streak, target, type Kind } from "@/lib/habits";

export default function HabitsPage() {
  const { today, entries, settings, isLoading } = useHabitData();
  const [date, setDate] = useState<string | null>(null);
  const selected = date ?? today;
  const strip = range(addDays(today, -6), 7);

  const creativeMonth = entries.filter((e) => e.kind === "creative" && e.date >= monthStart(today));
  const gymMonth = gymThisMonth(entries, today);
  const gymWeeks = range(addDays(today, -55), 8).filter((_, i) => i % 7 === 0); // 8 weekly buckets

  return (
    <>
      <PageHeader title="Habits" subtitle="Small things, most days" />

      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {strip.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d === today ? null : d)}
            className={cx(
              "flex min-h-16 flex-col items-center justify-center rounded-2xl text-[13px] font-medium transition press press-strong",
              d === selected ? "bg-accent text-white" : "bg-card text-muted shadow-card",
            )}
          >
            {formatWeekdayShort(d)}
            <span className={cx("text-[19px] font-semibold", d !== selected && "text-text")}>{Number(d.slice(8))}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="lg:row-span-2">
          <CardTitle>{relativeDay(selected, today)}</CardTitle>
          {isLoading ? <Skeleton className="h-56" /> : <HabitDay date={selected} entries={entries} settings={settings} />}
        </Card>

        {(["water", "sleep", "creative"] as Kind[]).map((k, i) => {
          const m = HABIT_META[k];
          const s = streak(entries, k, settings, today);
          const week = lastNDays(entries, k, today);
          const hits = week.filter((d) => isHit(k, d.value, settings)).length;
          return (
            <Card key={k} delay={i * 50}>
              <CardTitle action={<span className="text-[15px] font-semibold">{s > 0 ? `🔥 ${s} day${s === 1 ? "" : "s"}` : ""}</span>}>
                {m.emoji} {m.label}
              </CardTitle>
              <WeekBars data={week} color={m.color} goal={k === "creative" ? settings.creativeTarget : target(k, settings)} unit={m.unit} settingsHit={(v) => isHit(k, v, settings)} />
              <p className="mt-3 text-[14px] text-muted">
                {hits}/7 days this week
                {k === "sleep" && week.some((d) => d.value) && ` · avg ${(week.filter((d) => d.value).reduce((a, b) => a + b.value, 0) / week.filter((d) => d.value).length).toFixed(1)}h`}
                {k === "creative" && ` · ${week.reduce((a, b) => a + b.value, 0)} min`}
              </p>
              {k === "creative" && creativeMonth.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3 text-[14px]">
                  {CREATIVE_TYPES.map((t) => {
                    const mins = creativeMonth.filter((e) => e.subtype === t.value).reduce((a, b) => a + b.value, 0);
                    return mins ? (
                      <span key={t.value}>
                        {t.emoji} {mins} min <span className="text-muted">this month</span>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </Card>
          );
        })}

        <Card delay={160}>
          <CardTitle>💪 Gym</CardTitle>
          <div className="flex items-end gap-3">
            <span className="text-[44px] font-semibold leading-none tabular-nums">
              <NumericText value={gymMonth} />
            </span>
            <span className="pb-1 text-muted">session{gymMonth === 1 ? "" : "s"} this month</span>
          </div>
          <p className="mt-2 text-[15px] text-muted">
            {gymMonth === 0 ? "Whenever you're ready — your first one will be a win. 🌱" : gymMonth < 4 ? "You've started. That's the hardest bit. 🙌" : "Look at you go! Keep it fun. 🎉"}
          </p>
          <div className="mt-4">
            <p className="mb-1 text-[13px] text-muted">Sessions per week (last 8 weeks)</p>
            <WeekBars
              data={gymWeeks.map((ws) => ({ date: ws, value: entries.filter((e) => e.kind === "gym" && e.date >= ws && e.date <= addDays(ws, 6)).length }))}
              color={HABIT_META.gym.color}
              unit="sessions"
              label={(d) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`}
              settingsHit={() => true}
            />
          </div>
          <label className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-card-2 px-4 text-[15px]">
            Gentle nudges
            <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={settings.gymNudge} onChange={(e) => saveSettings({ gymNudge: e.target.checked })} />
          </label>
        </Card>
      </div>
    </>
  );
}
