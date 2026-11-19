"use client";

import { useMemo, useState } from "react";
import type { CalEvent } from "@/db/schema";
import { EventItem, EventSheet, timeRange } from "@/components/events";
import { IconChevronLeft, IconChevronRight, IconPlus } from "@/components/Icons";
import { Button, Card, Empty, IconButton, PageHeader, Segmented, Skeleton, cx } from "@/components/ui";
import { useEvents } from "@/lib/client";
import { categoryColor } from "@/lib/categories";
import { addDays, formatDayMonth, formatLong, formatMonthYear, formatWeekdayShort, nowTime, range, weekStart } from "@/lib/dates";
import { expandEvents, type Occurrence } from "@/lib/recurrence";
import { useToday } from "@/lib/useToday";

const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_PX = 56;

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export default function CalendarPage() {
  const today = useToday();
  const { data: events } = useEvents();
  const [view, setView] = useState<"day" | "week">("day");
  const [cursor, setCursor] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ ev: CalEvent | null; date?: string } | null>(null);
  const day = cursor ?? today;

  const from = view === "day" ? day : weekStart(day);
  const days = view === "day" ? [day] : range(from, 7);
  const occ = useMemo(() => expandEvents(events ?? [], days[0], days[days.length - 1]), [events, days]);
  const step = (n: number) => setCursor(addDays(day, view === "day" ? n : n * 7));

  const title = view === "day" ? formatLong(day) : `${formatDayMonth(days[0])} – ${formatDayMonth(days[6])}`;

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle={formatMonthYear(day)}
        action={
          <Button onClick={() => setEdit({ ev: null })} className="mb-1">
            <IconPlus size={20} /> Event
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
          ]}
          className="w-40"
        />
        <div className="ml-auto flex items-center">
          <IconButton label="Previous" onClick={() => step(-1)}>
            <IconChevronLeft />
          </IconButton>
          <button onClick={() => setCursor(null)} className="min-h-11 rounded-full px-3 text-[15px] font-semibold text-accent">
            Today
          </button>
          <IconButton label="Next" onClick={() => step(1)}>
            <IconChevronRight />
          </IconButton>
        </div>
      </div>
      <h2 className="mb-3 text-[20px] font-semibold">{title}</h2>

      {!events ? (
        <Card>
          <Skeleton className="h-64" />
        </Card>
      ) : view === "day" ? (
        <DayTimeline date={day} occ={occ} today={today} onOpen={(ev) => setEdit({ ev, date: ev.occurrenceDate })} onAdd={() => setEdit({ ev: null })} />
      ) : (
        <WeekView days={days} occ={occ} today={today} onOpen={(ev) => setEdit({ ev, date: ev.occurrenceDate })} onPick={(d) => { setCursor(d); setView("day"); }} />
      )}

      <EventSheet open={!!edit} onClose={() => setEdit(null)} event={edit?.ev} occurrenceDate={edit?.date} defaultDate={day} />
    </>
  );
}

function DayTimeline({ date, occ, today, onOpen, onAdd }: { date: string; occ: Occurrence[]; today: string; onOpen: (e: Occurrence) => void; onAdd: () => void }) {
  const allDay = occ.filter((e) => !e.startTime);
  const timed = occ.filter((e) => e.startTime);
  const minStart = Math.min(START_HOUR * 60, ...timed.map((e) => toMin(e.startTime!)));
  const first = Math.floor(minStart / 60);
  const hours = range("2000-01-01", END_HOUR - first + 1).map((_, i) => first + i);
  const now = nowTime();
  const nowTop = ((toMin(now) - first * 60) / 60) * HOUR_PX;

  return (
    <Card className="!p-0">
      {allDay.length > 0 && (
        <div className="space-y-2 border-b border-line p-3">
          {allDay.map((e) => (
            <EventItem key={e.id} ev={e} onClick={() => onOpen(e)} />
          ))}
        </div>
      )}
      {occ.length === 0 && (
        <div className="border-b border-line">
          <Empty emoji="🌤️">
            Free day.{" "}
            <button className="font-medium text-accent" onClick={onAdd}>
              Add something?
            </button>
          </Empty>
        </div>
      )}
      <div className="relative py-3 pr-3" style={{ height: hours.length * HOUR_PX + 24 }}>
        {hours.map((h, i) => (
          <div key={h} className="absolute inset-x-0 flex items-start" style={{ top: 12 + i * HOUR_PX }}>
            <span className="w-14 -translate-y-2 pr-2 text-right text-[12px] tabular-nums text-faint">{String(h).padStart(2, "0")}:00</span>
            <span className="flex-1 border-t border-line" />
          </div>
        ))}
        {date === today && nowTop > 0 && nowTop < hours.length * HOUR_PX && (
          <div className="absolute left-12 right-3 z-10 flex items-center" style={{ top: 12 + nowTop }} aria-label="Now">
            <span className="h-2.5 w-2.5 -translate-x-1 rounded-full bg-danger" />
            <span className="flex-1 border-t-2 border-danger" />
          </div>
        )}
        {layout(timed).map(({ ev, col, cols }) => {
          const s = toMin(ev.startTime!);
          const e = ev.endTime ? Math.max(toMin(ev.endTime), s + 20) : s + 60;
          const c = categoryColor(ev.category);
          return (
            <button
              key={ev.id}
              onClick={() => onOpen(ev)}
              className="absolute overflow-hidden rounded-xl border-l-[3px] px-2 py-1 text-left transition press"
              style={{
                top: 12 + ((s - first * 60) / 60) * HOUR_PX + 1,
                height: ((e - s) / 60) * HOUR_PX - 2,
                left: `calc(56px + (100% - 68px) * ${col / cols})`,
                width: `calc((100% - 68px) / ${cols} - 2px)`,
                background: c.soft,
                borderColor: c.dot,
              }}
            >
              <span className="block truncate text-[15px] font-semibold">{ev.title}</span>
              <span className="block truncate text-[12px] text-muted">
                {timeRange(ev)}
                {ev.location && ` · ${ev.location}`}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/** Side-by-side columns for overlapping events. */
function layout(evs: Occurrence[]) {
  const sorted = [...evs].sort((a, b) => a.startTime!.localeCompare(b.startTime!));
  const out: { ev: Occurrence; col: number; cols: number }[] = [];
  let group: { ev: Occurrence; col: number; end: number }[] = [];
  let groupEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...group.map((g) => g.col + 1));
    group.forEach((g) => out.push({ ev: g.ev, col: g.col, cols }));
    group = [];
  };
  for (const ev of sorted) {
    const s = toMin(ev.startTime!);
    const e = ev.endTime ? toMin(ev.endTime) : s + 60;
    if (s >= groupEnd) flush();
    const used = new Set(group.filter((g) => g.end > s).map((g) => g.col));
    let col = 0;
    while (used.has(col)) col++;
    group.push({ ev, col, end: e });
    groupEnd = Math.max(groupEnd, e);
  }
  flush();
  return out;
}

function WeekView({ days, occ, today, onOpen, onPick }: { days: string[]; occ: Occurrence[]; today: string; onOpen: (e: Occurrence) => void; onPick: (d: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7 md:gap-2">
      {days.map((d, i) => {
        const list = occ.filter((e) => e.occurrenceDate === d);
        const isToday = d === today;
        return (
          <Card key={d} delay={i * 30} className={cx("!p-3 md:min-h-56", isToday && "ring-2 ring-accent")}>
            <button onClick={() => onPick(d)} className="mb-2 flex w-full items-baseline gap-2 text-left">
              <span className={cx("text-[14px] font-semibold uppercase", isToday ? "text-accent" : "text-muted")}>{formatWeekdayShort(d)}</span>
              <span className={cx("text-[20px] font-semibold", isToday && "text-accent")}>{Number(d.slice(8))}</span>
            </button>
            {list.length === 0 ? (
              <p className="text-[14px] text-faint md:hidden">Nothing planned</p>
            ) : (
              <div className="space-y-1.5">
                {list.map((ev) => {
                  const c = categoryColor(ev.category);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onOpen(ev)}
                      className="block w-full rounded-lg border-l-[3px] px-2 py-1.5 text-left"
                      style={{ background: c.soft, borderColor: c.dot }}
                    >
                      <span className="block text-[12px] text-muted">{timeRange(ev)}</span>
                      <span className="block truncate text-[15px] font-medium md:text-[14px]">{ev.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
