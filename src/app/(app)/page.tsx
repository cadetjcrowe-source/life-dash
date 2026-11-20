"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { CalEvent, Task, TodayCardId } from "@/db/schema";
import { AssignmentsCard } from "@/components/AssignmentsCard";
import { useSecondaryNav } from "@/components/AppShell";
import { EventItem, EventSheet } from "@/components/events";
import { GoldenCard } from "@/components/GoldenCard";
import { NextLessonCard } from "@/components/NextLessonCard";
import { HabitDay, useHabitData } from "@/components/habits";
import { IconChevronRight, IconInbox, IconMore, IconPlus } from "@/components/Icons";
import { QuickCapture } from "@/components/QuickCapture";
import { TaskRow, TaskSheet } from "@/components/tasks";
import { Card, CardTitle, Empty, IconButton, Sheet, Skeleton } from "@/components/ui";
import { WeatherCard } from "@/components/WeatherCard";
import { useEvents, useInbox, useSettings, useTasks } from "@/lib/client";
import { DEFAULT_SETTINGS, TODAY_CARDS } from "@/lib/constants";
import { formatLong, greeting, nowTime, weekday } from "@/lib/dates";
import { expandEvents, type Occurrence } from "@/lib/recurrence";
import { topThree } from "@/lib/tasks";
import { useToday } from "@/lib/useToday";

export default function TodayPage() {
  const today = useToday();
  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: inbox } = useInbox();
  const { data: settings } = useSettings();
  const habits = useHabitData();
  const secondary = useSecondaryNav();
  const [menu, setMenu] = useState(false);
  const [editTask, setEditTask] = useState<Task | null | undefined>(undefined);
  const [editEvent, setEditEvent] = useState<{ ev: CalEvent | null; date?: string } | null>(null);

  const top = useMemo(() => topThree(tasks ?? [], today), [tasks, today]);
  const doneToday = (tasks ?? []).filter((t) => t.done && t.completedOn === today).length;
  const todays = useMemo(() => expandEvents(events ?? [], today, today), [events, today]);
  const now = nowTime();
  const isSunday = weekday(today) === 0;

  // Card order + visibility come from Settings; cards for disabled features are hidden.
  const s = settings ?? DEFAULT_SETTINGS;
  const order = s.todayCards.filter((c) => {
    const meta = TODAY_CARDS.find((m) => m.id === c.id);
    return c.visible && (!meta?.feature || s.features[meta.feature]);
  });

  const cards: Record<TodayCardId, ReactNode> = {
    weather: <WeatherCard />,
    lesson: <NextLessonCard />,
    golden: <GoldenCard />,
    assignments: <AssignmentsCard onOpen={setEditTask} />,
    events: (
      <Card>
        <CardTitle
          action={
            <IconButton label="Add event" onClick={() => setEditEvent({ ev: null })} className="-mr-2 text-accent">
              <IconPlus />
            </IconButton>
          }
        >
          <Link href="/calendar">Today's events</Link>
        </CardTitle>
        {!events ? (
          <Skeleton className="h-16" />
        ) : todays.length === 0 ? (
          <Empty emoji="🗓️">Nothing scheduled today</Empty>
        ) : (
          <div className="space-y-2">
            {todays.map((ev: Occurrence) => (
              <EventItem key={ev.id + ev.occurrenceDate} ev={ev} now={now} onClick={() => setEditEvent({ ev, date: ev.occurrenceDate })} />
            ))}
          </div>
        )}
      </Card>
    ),
    tasks: (
      <Card>
        <CardTitle
          action={
            <IconButton label="Add task" onClick={() => setEditTask(null)} className="-mr-2 text-accent">
              <IconPlus />
            </IconButton>
          }
        >
          <Link href="/tasks">Top 3 today</Link>
        </CardTitle>
        {!tasks ? (
          <Skeleton className="h-24" />
        ) : top.length === 0 ? (
          <Empty emoji="🎉">{doneToday ? `All clear — ${doneToday} done today` : "No tasks yet. Add one!"}</Empty>
        ) : (
          <div className="divide-y divide-line">
            {top.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={setEditTask} compact />
            ))}
          </div>
        )}
        {doneToday > 0 && top.length > 0 && <p className="mt-2 text-[14px] text-good">✓ {doneToday} done today</p>}
      </Card>
    ),
    habits: (
      <Card>
        <CardTitle action={<Link href="/habits" className="text-[15px] font-medium text-accent">Streaks</Link>}>Habits</CardTitle>
        {habits.isLoading ? <Skeleton className="h-48" /> : <HabitDay date={today} entries={habits.entries} settings={habits.settings} />}
      </Card>
    ),
    inbox:
      inbox && inbox.length > 0 ? (
        <Link href="/tasks#inbox" className="anim-rise press press-subtle flex items-center gap-3 rounded-[var(--radius-card)] bg-card p-4 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <IconInbox size={20} />
          </span>
          <span className="flex-1">
            <span className="block font-medium">Inbox</span>
            <span className="text-[14px] text-muted">
              {inbox.length} item{inbox.length === 1 ? "" : "s"} to sort
            </span>
          </span>
          <IconChevronRight className="text-faint" />
        </Link>
      ) : null,
  };

  return (
    <>
      <header className="flex items-start justify-between gap-3 pt-4 md:pt-8">
        <div>
          <p className="text-[15px] font-semibold uppercase tracking-wide text-accent">{formatLong(today)}</p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight md:text-[36px]">{greeting()}
            {s.ownerName ? `, ${s.ownerName}` : ""}
          </h1>
        </div>
        <IconButton label="More" onClick={() => setMenu(true)} className="mt-1 bg-card shadow-card md:hidden">
          <IconMore />
        </IconButton>
      </header>

      <QuickCapture className="mt-4" />

      {isSunday && (
        <Link href="/review" className="anim-rise press press-subtle mt-4 flex items-center justify-between rounded-[var(--radius-card)] bg-accent p-4 text-white shadow-card">
          <span>
            <span className="block text-[17px] font-semibold">It's Sunday — time for your weekly review</span>
            <span className="text-[15px] opacity-85">See how your week went and plan your top 3.</span>
          </span>
          <IconChevronRight />
        </Link>
      )}

      {/* Cards flow down the columns in the order chosen in Settings. */}
      <div className="mt-4 gap-4 md:columns-2 xl:columns-3">
        {order.map(({ id }) =>
          cards[id] ? (
            <div key={id} className="mb-4 break-inside-avoid">
              {cards[id]}
            </div>
          ) : null,
        )}
      </div>

      <TaskSheet open={editTask !== undefined} onClose={() => setEditTask(undefined)} task={editTask} defaultDue={today} />
      <EventSheet open={!!editEvent} onClose={() => setEditEvent(null)} event={editEvent?.ev} occurrenceDate={editEvent?.date} defaultDate={today} />

      <Sheet open={menu} onClose={() => setMenu(false)} title="More">
        <nav className="space-y-2 pb-2">
          {secondary.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setMenu(false)} className="press press-subtle flex min-h-14 items-center gap-3 rounded-2xl bg-card-2 px-4 text-[17px] font-medium">
              <Icon className="text-accent" />
              <span className="flex-1">{label}</span>
              <IconChevronRight className="text-faint" />
            </Link>
          ))}
        </nav>
      </Sheet>
    </>
  );
}
