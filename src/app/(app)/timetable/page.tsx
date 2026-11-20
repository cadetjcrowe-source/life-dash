"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconPlus } from "@/components/Icons";
import { toast } from "@/components/Toast";
import { Button, Card, Field, IconButton, PageHeader, Segmented, Sheet, Skeleton, cx } from "@/components/ui";
import { addEvent, deleteEvent, saveSettings, updateEvent } from "@/lib/actions";
import { categoryColor } from "@/lib/categories";
import { useEvents, useSettings } from "@/lib/client";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { addDays, formatDayMonth, formatShort, formatWeekdayShort, nowTime, weekStart } from "@/lib/dates";
import { lessonsBetween, schoolWeek, subjectOf, type Lesson } from "@/lib/timetable";
import { useToday } from "@/lib/useToday";

const START = 8; // 08:00
const END = 18; // 18:00
const HOUR_PX = 64;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const clampTop = (m: number) => Math.min(Math.max(m - START * 60, 0), (END - START) * 60);

export default function TimetablePage() {
  const today = useToday();
  const { data: events } = useEvents();
  const { data: settings } = useSettings();
  const group = (settings ?? DEFAULT_SETTINGS).timetableGroup;
  const [week, setWeek] = useState<string | null>(null); // Monday of the week shown
  const monday = week ?? weekStart(weekdayOrNext(today));
  const days = schoolWeek(monday);
  const lessons = useMemo(() => lessonsBetween(events ?? [], days[0], days[4]), [events, days[0]]); // eslint-disable-line react-hooks/exhaustive-deps
  const [edit, setEdit] = useState<{ lesson: Lesson | null; dayIdx: number } | null>(null);

  // Mobile: one day per screen, swipe between them (native scroll-snap).
  const scroller = useRef<HTMLDivElement>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const todayIdx = days.indexOf(today);
  useLayoutEffect(() => {
    const i = todayIdx >= 0 ? todayIdx : 0;
    setDayIdx(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "instant" as ScrollBehavior });
  }, [monday, todayIdx, !!events]); // eslint-disable-line react-hooks/exhaustive-deps
  const onScroll = () => {
    const el = scroller.current;
    if (el && el.clientWidth) setDayIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setDayIdx(i);
  };

  const thisMonday = weekStart(weekdayOrNext(today));
  const weekLabel = monday === thisMonday ? "This week" : monday === addDays(thisMonday, 7) ? "Next week" : monday === addDays(thisMonday, -7) ? "Last week" : `Week of ${formatDayMonth(monday)}`;
  const count = lessons.filter((l) => !l.skipped).length;

  return (
    <>
      <PageHeader
        title="Timetable"
        subtitle={
          <button
            className="text-left"
            onClick={() => {
              const g = prompt("Your group", group);
              if (g !== null) saveSettings({ timetableGroup: g.trim() });
            }}
          >
            {group ? `Group ${group}` : "Set your group"} · {count} lesson{count === 1 ? "" : "s"}
          </button>
        }
        action={
          <Button onClick={() => setEdit({ lesson: null, dayIdx })} className="mb-1">
            <IconPlus size={20} /> Lesson
          </Button>
        }
      />

      <div className="mb-3 flex items-center gap-1">
        <IconButton label="Previous week" onClick={() => setWeek(addDays(monday, -7))}>
          <IconChevronLeft />
        </IconButton>
        <button onClick={() => setWeek(null)} className="min-h-11 px-1 text-[16px] font-semibold">
          {weekLabel}
        </button>
        <IconButton label="Next week" onClick={() => setWeek(addDays(monday, 7))}>
          <IconChevronRight />
        </IconButton>
        <span className="ml-auto text-[14px] text-muted">
          {formatDayMonth(days[0])} – {formatDayMonth(days[4])}
        </span>
      </div>

      {/* Day picker – mobile only (desktop shows all five days). */}
      <div className="mb-3 grid grid-cols-5 gap-1.5 md:hidden" role="tablist">
        {days.map((d, i) => {
          const n = lessons.filter((l) => l.occurrenceDate === d && !l.skipped).length;
          return (
            <button
              key={d}
              role="tab"
              aria-selected={dayIdx === i}
              onClick={() => goTo(i)}
              className={cx(
                "press flex min-h-[60px] flex-col items-center justify-center rounded-2xl text-[13px] font-medium",
                dayIdx === i ? "bg-accent text-white" : "bg-card text-muted shadow-card",
              )}
            >
              {DAYS[i]}
              <span className={cx("text-[18px] font-semibold", dayIdx !== i && (d === today ? "text-accent" : "text-text"))}>{Number(d.slice(8))}</span>
              <span className="flex h-1.5 gap-0.5">
                {Array.from({ length: Math.min(n, 4) }, (_, k) => (
                  <span key={k} className={cx("h-1 w-1 rounded-full", dayIdx === i ? "bg-white/80" : "bg-faint")} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {!events ? (
        <Card>
          <Skeleton className="h-[480px]" />
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          {/* Desktop day headers */}
          <div className="hidden border-b border-line md:grid md:grid-cols-[48px_repeat(5,minmax(0,1fr))]">
            <span />
            {days.map((d) => (
              <div key={d} className={cx("px-2 py-2.5 text-center text-[14px] font-semibold", d === today ? "text-accent" : "text-muted")}>
                {formatWeekdayShort(d)} {Number(d.slice(8))}
              </div>
            ))}
          </div>
          <div className="flex">
            {/* Time axis */}
            <div className="relative w-12 shrink-0" style={{ height: (END - START) * HOUR_PX + 16 }}>
              {Array.from({ length: END - START + 1 }, (_, i) => (
                <span key={i} className="absolute right-1.5 -translate-y-1/2 text-[11px] tabular-nums text-faint" style={{ top: 8 + i * HOUR_PX }}>
                  {String(START + i).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            <div
              ref={scroller}
              onScroll={onScroll}
              className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain md:grid md:grid-cols-5 md:overflow-visible"
            >
              {days.map((d, i) => (
                <DayColumn
                  key={d}
                  date={d}
                  today={today}
                  lessons={lessons.filter((l) => l.occurrenceDate === d)}
                  onOpen={(l) => setEdit({ lesson: l, dayIdx: i })}
                  onAdd={() => setEdit({ lesson: null, dayIdx: i })}
                />
              ))}
            </div>
          </div>
        </Card>
      )}
      <p className="mt-3 px-1 text-[13px] text-muted">Tap a lesson to edit it or skip a single week. Lessons also appear in your Calendar.</p>

      <LessonSheet open={!!edit} lesson={edit?.lesson ?? null} dayIdx={edit?.dayIdx ?? 0} monday={monday} onClose={() => setEdit(null)} />
    </>
  );
}

/** Weekends show the coming week. */
function weekdayOrNext(d: string) {
  const wd = new Date(d + "T12:00:00Z").getUTCDay();
  return wd === 6 ? addDays(d, 2) : wd === 0 ? addDays(d, 1) : d;
}

function DayColumn({ date, today, lessons, onOpen, onAdd }: { date: string; today: string; lessons: Lesson[]; onOpen: (l: Lesson) => void; onAdd: () => void }) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    if (date !== today) return;
    setNow(nowTime());
    const id = setInterval(() => setNow(nowTime()), 60_000);
    return () => clearInterval(id);
  }, [date, today]);
  const col = categoryColor("College");
  const nowTop = now ? clampTop(toMin(now)) : -1;
  const free = lessons.every((l) => l.skipped);

  return (
    <div
      className={cx("relative w-full shrink-0 snap-start snap-always border-line md:w-auto md:border-l", date === today && "bg-accent-soft/40")}
      style={{ height: (END - START) * HOUR_PX + 16 }}
      aria-label={formatShort(date)}
    >
      {Array.from({ length: END - START + 1 }, (_, i) => (
        <div key={i} className="absolute inset-x-0 border-t border-line" style={{ top: 8 + i * HOUR_PX }} />
      ))}
      {free && (
        <button onClick={onAdd} className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-2xl bg-card/80 p-4 text-center text-[15px] text-muted md:hidden">
          No lessons 🎉
          <span className="block text-[13px] text-accent">Tap to add one</span>
        </button>
      )}
      {lessons.map((l) => {
        if (!l.startTime) return null;
        const s = toMin(l.startTime);
        const e = l.endTime ? Math.max(toMin(l.endTime), s + 20) : s + 60;
        const top = 8 + (clampTop(s) / 60) * HOUR_PX;
        const height = ((clampTop(e) - clampTop(s)) / 60) * HOUR_PX;
        return (
          <button
            key={l.id}
            onClick={() => onOpen(l)}
            className={cx(
              "press press-subtle absolute left-1.5 right-1.5 overflow-hidden rounded-xl border-l-[3px] px-2.5 py-1.5 text-left",
              l.skipped && "border-dashed opacity-45",
            )}
            style={{ top: top + 1, height: Math.max(height - 2, 28), background: col.soft, borderColor: col.dot }}
          >
            <span className={cx("block truncate text-[16px] font-bold leading-tight", l.skipped && "line-through")}>{l.location || "Room TBC"}</span>
            <span className="block truncate text-[13px] text-muted">
              {l.startTime}–{l.endTime}
              {l.skipped ? " · skipped" : ` · ${subjectOf(l)}`}
            </span>
          </button>
        );
      })}
      {nowTop >= 0 && (
        <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: 8 + (nowTop / 60) * HOUR_PX }} aria-label="Now">
          <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-danger" />
          <span className="flex-1 border-t-2 border-danger" />
        </div>
      )}
    </div>
  );
}

type Draft = { title: string; location: string; dayIdx: number; startTime: string; endTime: string; repeatUntil: string | null };

function LessonSheet({ open, lesson, dayIdx, monday, onClose }: { open: boolean; lesson: Lesson | null; dayIdx: number; monday: string; onClose: () => void }) {
  const [d, setD] = useState<Draft>({ title: "", location: "", dayIdx: 0, startTime: "09:00", endTime: "10:00", repeatUntil: null });
  useEffect(() => {
    if (!open) return;
    setD(
      lesson
        ? {
            title: lesson.title === "Lesson" ? "" : lesson.title,
            location: lesson.location,
            dayIdx: (new Date(lesson.date + "T12:00:00Z").getUTCDay() + 6) % 7,
            startTime: lesson.startTime ?? "09:00",
            endTime: lesson.endTime ?? "10:00",
            repeatUntil: lesson.repeatUntil,
          }
        : { title: "", location: "", dayIdx: Math.min(dayIdx, 4), startTime: "09:00", endTime: "10:00", repeatUntil: null },
    );
  }, [open, lesson, dayIdx]);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));
  const valid = d.location.trim() && d.startTime && d.endTime && d.startTime < d.endTime;

  const save = () => {
    if (!valid) return;
    const fields = {
      title: d.title.trim() || "Lesson",
      location: d.location.trim(),
      startTime: d.startTime,
      endTime: d.endTime,
      repeatUntil: d.repeatUntil || null,
    };
    if (lesson) {
      // Keep the series' first week; just move it to the chosen weekday.
      updateEvent(lesson.id, { ...fields, date: addDays(weekStart(lesson.date), d.dayIdx) });
    } else {
      addEvent({ ...fields, date: addDays(monday, d.dayIdx), category: "College", repeat: "weekly", excludedDates: [], kind: "lesson" });
    }
    toast(lesson ? "Lesson updated" : "Lesson added");
    onClose();
  };

  const skipped = lesson?.skipped ?? false;
  const toggleSkip = (l: Lesson) => {
    const ex = l.excludedDates ?? [];
    updateEvent(l.id, { excludedDates: skipped ? ex.filter((x) => x !== l.occurrenceDate) : [...ex, l.occurrenceDate] });
    toast(skipped ? `Restored for ${formatShort(l.occurrenceDate)}` : `Skipped ${formatShort(l.occurrenceDate)} only`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={lesson ? "Edit lesson" : "New lesson"}
      footer={
        <div className="space-y-2">
          <Button size="lg" className="w-full" onClick={save} disabled={!valid}>
            {lesson ? "Save" : "Add lesson"}
          </Button>
          {lesson && (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => toggleSkip(lesson)}>
                {skipped ? `Restore ${formatShort(lesson.occurrenceDate)}` : `Skip ${formatShort(lesson.occurrenceDate)}`}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (confirm("Delete this lesson from every week?")) {
                    deleteEvent(lesson.id);
                    onClose();
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Subject">
          <input className="field text-[18px] font-medium" placeholder="e.g. Photography, Editing" value={d.title} onChange={(e) => set("title", e.target.value)} autoFocus={!lesson} />
        </Field>
        <Field label="Room">
          <input className="field" placeholder="e.g. K303" value={d.location} onChange={(e) => set("location", e.target.value.toUpperCase())} autoCapitalize="characters" />
        </Field>
        <Field label="Day">
          <Segmented value={d.dayIdx} onChange={(v) => set("dayIdx", v)} options={DAYS.map((label, i) => ({ value: i, label }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts">
            <input type="time" className="field" value={d.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </Field>
          <Field label="Ends">
            <input type="time" className="field" value={d.endTime} onChange={(e) => set("endTime", e.target.value)} />
          </Field>
        </div>
        {d.startTime >= d.endTime && <p className="-mt-2 text-[14px] text-danger">The end time needs to be after the start.</p>}
        <Field label="Last week of term (optional)" hint="After this date the lesson stops repeating. Leave empty to repeat every week.">
          <input type="date" className="field" value={d.repeatUntil ?? ""} onChange={(e) => set("repeatUntil", e.target.value || null)} />
        </Field>
        {lesson && <p className="text-[13px] text-muted">To miss just one week (holiday, cancelled lesson), use Skip below. The lesson stays in every other week.</p>}
      </div>
    </Sheet>
  );
}

