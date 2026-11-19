"use client";

import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/Icons";
import { toast } from "@/components/Toast";
import { Button, Card, CardTitle, Empty, Field, IconButton, PageHeader, Progress, Skeleton, cx } from "@/components/ui";
import { api, refresh, useReview, useReviews } from "@/lib/client";
import { CREATIVE_TYPES } from "@/lib/constants";
import { categoryColor, useCategoryNames } from "@/lib/categories";
import { addDays, formatDayMonth, weekStart } from "@/lib/dates";
import { useToday } from "@/lib/useToday";

function Stat({ label, value, sub, emoji }: { label: string; value: React.ReactNode; sub?: string; emoji: string }) {
  return (
    <div className="rounded-2xl bg-card-2 p-3.5">
      <div className="text-[13px] font-medium text-muted">
        {emoji} {label}
      </div>
      <div className="mt-1 text-[28px] font-semibold leading-tight tabular-nums">{value}</div>
      {sub && <div className="text-[13px] text-muted">{sub}</div>}
    </div>
  );
}

export default function ReviewPage() {
  const today = useToday();
  const thisWeek = weekStart(today);
  const [week, setWeek] = useState(thisWeek);
  const { data, isLoading } = useReview(week);
  const { data: past } = useReviews();
  const CATEGORY_NAMES = useCategoryNames();

  const [wentWell, setWentWell] = useState("");
  const [didnt, setDidnt] = useState("");
  const [top3, setTop3] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data || data.weekStart !== week) return;
    setWentWell(data.saved?.wentWell ?? "");
    setDidnt(data.saved?.didnt ?? "");
    const t = data.saved?.top3 ?? [];
    setTop3([t[0] ?? "", t[1] ?? "", t[2] ?? ""]);
  }, [data, week]);

  const s = data?.live;
  const save = async () => {
    setSaving(true);
    try {
      await api(`/api/reviews/${week}`, "PUT", { wentWell, didnt, top3: top3.map((t) => t.trim()).filter(Boolean) });
      toast("Review saved ✨");
      refresh(`/api/reviews`);
    } catch {
      toast("Couldn't save — try again");
    }
    setSaving(false);
  };

  return (
    <>
      <PageHeader title="Weekly review" subtitle={`${formatDayMonth(week)} – ${formatDayMonth(addDays(week, 6))}`} />
      <div className="mb-4 flex items-center gap-1">
        <IconButton label="Previous week" onClick={() => setWeek(addDays(week, -7))}>
          <IconChevronLeft />
        </IconButton>
        <span className="text-[15px] font-medium">{week === thisWeek ? "This week" : week === addDays(thisWeek, -7) ? "Last week" : `Week of ${formatDayMonth(week)}`}</span>
        <IconButton label="Next week" onClick={() => setWeek(addDays(week, 7))} disabled={week >= thisWeek} className="disabled:opacity-20">
          <IconChevronRight />
        </IconButton>
        {data?.saved && <span className="ml-auto text-[14px] text-good">✓ Saved</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Your week</CardTitle>
          {isLoading || !s ? (
            <Skeleton className="h-60" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <Stat emoji="✅" label="Tasks done" value={s.tasksCompleted} />
                <Stat emoji="🎨" label="Creative" value={`${s.creativeMinutes}m`} sub={`${s.habits.creativeDays} day${s.habits.creativeDays === 1 ? "" : "s"}`} />
                <Stat emoji="💪" label="Gym" value={s.gymSessions} sub={s.gymSessions ? "Brilliant!" : "Next week?"} />
                <Stat emoji="😴" label="Sleep avg" value={s.habits.sleepAvg != null ? `${s.habits.sleepAvg}h` : "–"} sub={`${s.habits.sleepDaysHit}/7 on target`} />
                <Stat emoji="💧" label="Water" value={`${s.habits.waterDaysHit}/7`} sub="days on target" />
                <Stat emoji="📓" label="Journal" value={`${s.journalDays}/7`} sub="days written" />
              </div>

              {s.tasksCompleted > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[14px] font-medium text-muted">Tasks by category</p>
                  <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
                    {[...CATEGORY_NAMES, ...Object.keys(s.tasksByCategory).filter((k) => !CATEGORY_NAMES.includes(k))].filter((c) => s.tasksByCategory[c]).map((c) => (
                      <span key={c} title={`${c}: ${s.tasksByCategory[c]}`} style={{ flex: s.tasksByCategory[c], background: categoryColor(c).dot }} />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                    {[...CATEGORY_NAMES, ...Object.keys(s.tasksByCategory).filter((k) => !CATEGORY_NAMES.includes(k))].filter((c) => s.tasksByCategory[c]).map((c) => (
                      <span key={c} className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(c).dot }} />
                        {c} <span className="text-muted">{s.tasksByCategory[c]}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {s.creativeMinutes > 0 && (
                <p className="mt-4 text-[14px] text-muted">
                  {CREATIVE_TYPES.filter((t) => s.creativeByType[t.value]).map((t) => `${t.emoji} ${s.creativeByType[t.value]} min ${t.label.toLowerCase()}`).join(" · ")}
                </p>
              )}

              <div className="mt-5">
                <p className="mb-2 text-[14px] font-medium text-muted">Project progress</p>
                {s.projects.length === 0 ? (
                  <p className="text-[15px] text-faint">No project progress logged this week.</p>
                ) : (
                  <ul className="space-y-3">
                    {s.projects.map((p) => (
                      <li key={p.id}>
                        <div className="mb-1 flex justify-between text-[15px]">
                          <span>
                            {p.emoji} {p.name}
                          </span>
                          <span className={cx("font-semibold tabular-nums", p.to > p.from ? "text-good" : "text-muted")}>
                            {p.from}% → {p.to}%
                          </span>
                        </div>
                        <Progress value={p.to} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Reflect</CardTitle>
          <div className="space-y-4">
            <Field label="What went well?">
              <textarea className="field min-h-24" value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
            </Field>
            <Field label="What didn't?">
              <textarea className="field min-h-24" value={didnt} onChange={(e) => setDidnt(e.target.value)} />
            </Field>
            <Field label="Top 3 for next week">
              <div className="space-y-2">
                {top3.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent">{i + 1}</span>
                    <input className="field" value={t} onChange={(e) => setTop3((s) => s.map((x, j) => (j === i ? e.target.value : x)))} />
                  </div>
                ))}
              </div>
            </Field>
            <Button size="lg" className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving…" : data?.saved ? "Update review" : "Save review"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle>Past reviews</CardTitle>
        {!past ? (
          <Skeleton className="h-16" />
        ) : past.length === 0 ? (
          <Empty emoji="🗂️">Your saved reviews will appear here</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {past.map((r) => (
              <li key={r.weekStart}>
                <button onClick={() => { setWeek(r.weekStart); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="press press-subtle flex w-full items-center gap-3 py-3 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">Week of {formatDayMonth(r.weekStart)}</span>
                    <span className="block truncate text-[14px] text-muted">
                      {r.summary.tasksCompleted} tasks · {r.summary.creativeMinutes} creative min · {r.summary.gymSessions} gym
                      {r.top3.length > 0 && ` · Top: ${r.top3[0]}`}
                    </span>
                  </span>
                  <IconChevronRight className="text-faint" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
