"use client";

import { useState } from "react";
import type { GymDay, GymExercise } from "@/db/schema";
import { useHabitData } from "@/components/habits";
import { IconChevronDown, IconChevronUp, IconClose, IconPlus } from "@/components/Icons";
import { toast } from "@/components/Toast";
import { Button, Card, CardTitle, Confetti, Field, IconButton, NumericText, PageHeader, Pill, Skeleton, cx } from "@/components/ui";
import { logHabit, saveSettings } from "@/lib/actions";
import { uid } from "@/lib/client";
import { DEFAULT_GYM_PLAN } from "@/lib/constants";
import { relativeDay } from "@/lib/dates";
import { CELEBRATIONS, gymThisMonth } from "@/lib/habits";

export default function GymPage() {
  const { today, entries, settings, isLoading } = useHabitData();
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);

  const plan = settings.gymPlan;
  const sessions = entries.filter((e) => e.kind === "gym").sort((a, b) => b.date.localeCompare(a.date) || +new Date(b.createdAt) - +new Date(a.createdAt));
  const month = gymThisMonth(entries, today);
  // Suggest the day after the last one you did – a suggestion, never a rule.
  const lastIdx = plan.findIndex((d) => d.name === sessions[0]?.note);
  const nextDay = plan.length ? plan[(lastIdx + 1) % plan.length] : null;
  const shownOpen = open ?? nextDay?.id ?? null;

  const log = (day: GymDay) => {
    logHabit({ date: today, kind: "gym", value: 0, note: day.name });
    setBurst((b) => b + 1);
    navigator.vibrate?.([10, 40, 10]);
    toast(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
  };

  return (
    <>
      <PageHeader
        title="Gym plan"
        subtitle="3 times a week · full body"
        action={
          <Button variant={editing ? "primary" : "secondary"} onClick={() => setEditing((e) => !e)} className="mb-1">
            {editing ? "Done" : "Edit plan"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <Skeleton className="h-60" />
            </Card>
          ) : editing ? (
            <PlanEditor plan={plan} onDone={() => setEditing(false)} />
          ) : (
            plan.map((day, i) => {
              const isOpen = shownOpen === day.id;
              return (
                <Card key={day.id} delay={i * 50}>
                  <button onClick={() => setOpen(isOpen ? "" : day.id)} className="flex w-full items-center gap-3 text-left">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-good-soft text-[18px] font-bold text-good">{day.name.replace(/^Day\s*/i, "") || i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[18px] font-semibold">
                        {day.name}
                        {nextDay?.id === day.id && <Pill tone="good">Up next</Pill>}
                      </span>
                      <span className="text-[14px] text-muted">
                        {day.focus} · {day.exercises.length} exercises
                      </span>
                    </span>
                    {isOpen ? <IconChevronUp className="text-faint" /> : <IconChevronDown className="text-faint" />}
                  </button>
                  {isOpen && (
                    <div className="anim-rise mt-4">
                      <ol className="space-y-3">
                        {day.exercises.map((ex, n) => (
                          <li key={ex.id} className="rounded-2xl bg-card-2 p-3.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[17px] font-semibold">
                                {n + 1}. {ex.name}
                              </span>
                              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-good">
                                {ex.sets} × {ex.reps}
                              </span>
                            </div>
                            {ex.notes && <p className="mt-1 text-[15px] leading-snug text-muted">{ex.notes}</p>}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-3 text-[14px] text-muted">
                        Warm up with 5 minutes of easy cardio. Pick weights that feel comfortable: you should finish each set with 2–3 reps left in the tank. Rest 60–90 s between sets.
                      </p>
                      <div className="relative mt-4">
                        <Button size="lg" className="w-full !bg-good" onClick={() => log(day)}>
                          I did {day.name} 🎉
                        </Button>
                        <Confetti trigger={burst} />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardTitle>💪 This month</CardTitle>
            <div className="flex items-end gap-3">
              <span className="text-[52px] font-semibold leading-none tabular-nums">
                <NumericText value={month} />
              </span>
              <span className="pb-1.5 text-muted">session{month === 1 ? "" : "s"}</span>
            </div>
            <p className="mt-2 text-[15px] text-muted">
              {month === 0 ? "No rush — whenever you're ready, any session counts. 🌱" : month < 4 ? "You've started, and that's the hardest bit. 🙌" : "Brilliant consistency. Keep it fun! 🎉"}
            </p>
          </Card>
          <Card>
            <CardTitle>Recent sessions</CardTitle>
            {sessions.length === 0 ? (
              <p className="text-[15px] text-muted">Your sessions will show up here. Every one is a win.</p>
            ) : (
              <ul className="divide-y divide-line">
                {sessions.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex justify-between py-2 text-[15px]">
                    <span>✅ {s.note || "Gym session"}</span>
                    <span className="text-muted">{relativeDay(s.date, today)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

/** Edit days and exercises locally, then save the whole plan in one go. */
function PlanEditor({ plan, onDone }: { plan: GymDay[]; onDone: () => void }) {
  // Copied once when editing starts, so background sync never overwrites your edits.
  const [draft, setDraft] = useState<GymDay[]>(plan);

  const setDay = (id: string, patch: Partial<GymDay>) => setDraft((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const setEx = (dayId: string, exId: string, patch: Partial<GymExercise>) =>
    setDraft((d) => d.map((x) => (x.id === dayId ? { ...x, exercises: x.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) } : x)));
  const moveEx = (day: GymDay, i: number, dir: -1 | 1) => {
    const ex = [...day.exercises];
    const j = i + dir;
    if (j < 0 || j >= ex.length) return;
    [ex[i], ex[j]] = [ex[j], ex[i]];
    setDay(day.id, { exercises: ex });
  };
  const valid = draft.every((d) => d.name.trim() && d.exercises.every((e) => e.name.trim()));

  return (
    <>
      {draft.map((day) => (
        <Card key={day.id}>
          <div className="mb-3 flex gap-2">
            <input className="field font-semibold" value={day.name} onChange={(e) => setDay(day.id, { name: e.target.value })} aria-label="Day name" />
            <input className="field" value={day.focus} onChange={(e) => setDay(day.id, { focus: e.target.value })} aria-label="Focus" placeholder="Focus" />
            <IconButton label={`Remove ${day.name}`} onClick={() => setDraft((d) => d.filter((x) => x.id !== day.id))} className="text-danger">
              <IconClose />
            </IconButton>
          </div>
          <div className="space-y-3">
            {day.exercises.map((ex, i) => (
              <div key={ex.id} className="rounded-2xl bg-card-2 p-3">
                <div className="flex gap-2">
                  <input className="field !bg-card" value={ex.name} onChange={(e) => setEx(day.id, ex.id, { name: e.target.value })} placeholder="Exercise" aria-label="Exercise name" />
                  <div className="flex shrink-0">
                    <IconButton label="Move up" onClick={() => moveEx(day, i, -1)} disabled={i === 0} className="disabled:opacity-20">
                      <IconChevronUp size={20} />
                    </IconButton>
                    <IconButton label="Move down" onClick={() => moveEx(day, i, 1)} disabled={i === day.exercises.length - 1} className="disabled:opacity-20">
                      <IconChevronDown size={20} />
                    </IconButton>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Field label="Sets">
                    <input className="field !bg-card" type="number" inputMode="numeric" min={1} max={20} value={ex.sets} onChange={(e) => setEx(day.id, ex.id, { sets: Math.max(1, Number(e.target.value) || 1) })} />
                  </Field>
                  <Field label="Reps / time">
                    <input className="field !bg-card" value={ex.reps} onChange={(e) => setEx(day.id, ex.id, { reps: e.target.value })} />
                  </Field>
                  <div className="flex items-end">
                    <IconButton label={`Remove ${ex.name}`} onClick={() => setDay(day.id, { exercises: day.exercises.filter((e) => e.id !== ex.id) })} className="text-faint">
                      <IconClose size={18} />
                    </IconButton>
                  </div>
                </div>
                <textarea className="field mt-2 min-h-16 !bg-card text-[15px]" value={ex.notes} onChange={(e) => setEx(day.id, ex.id, { notes: e.target.value })} placeholder="How to do it" />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => setDay(day.id, { exercises: [...day.exercises, { id: uid(), name: "", sets: 3, reps: "10", notes: "" }] })}
          >
            <IconPlus size={18} /> Add exercise
          </Button>
        </Card>
      ))}
      <div className={cx("flex flex-wrap gap-2")}>
        <Button
          variant="secondary"
          onClick={() => setDraft((d) => [...d, { id: uid(), name: `Day ${String.fromCharCode(65 + d.length)}`, focus: "Full body", exercises: [] }])}
          disabled={draft.length >= 7}
        >
          <IconPlus size={18} /> Add day
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Replace your plan with the starter plan?")) setDraft(DEFAULT_GYM_PLAN);
          }}
        >
          Reset to starter plan
        </Button>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={!valid}
        onClick={() => {
          saveSettings({ gymPlan: draft.map((d) => ({ ...d, name: d.name.trim(), exercises: d.exercises.map((e) => ({ ...e, name: e.name.trim() })) })) });
          toast("Plan saved");
          onDone();
        }}
      >
        Save plan
      </Button>
    </>
  );
}
