"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useEvents } from "@/lib/client";
import { nowTime, relativeDay } from "@/lib/dates";
import { fmtMins, nextLesson, subjectOf, type Lesson } from "@/lib/timetable";
import { useToday } from "@/lib/useToday";
import { IconChevronRight, IconMapPin } from "./Icons";
import { Card, CardTitle, Skeleton, cx } from "./ui";

function Upcoming({ lesson, today, prefix }: { lesson: Lesson | null; today: string; prefix: string }) {
  if (!lesson) return <p className="mt-1 text-[15px] text-muted">No lessons in the next few weeks.</p>;
  return (
    <p className="mt-1 text-[15px] text-muted">
      {prefix} {relativeDay(lesson.occurrenceDate, today)} {lesson.startTime} · {subjectOf(lesson)} in <b className="font-semibold text-text">{lesson.location}</b>
    </p>
  );
}

/** Next lesson with room, start time and a live countdown. */
export function NextLessonCard() {
  const today = useToday();
  const { data: events } = useEvents();
  // Clock-based, so only rendered in the browser.
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    setNow(nowTime());
    const id = setInterval(() => setNow(nowTime()), 20_000);
    return () => clearInterval(id);
  }, []);

  const title = (
    <CardTitle action={<Link href="/timetable" className="flex items-center text-[15px] font-medium text-accent">Timetable<IconChevronRight size={16} /></Link>}>
      🎓 Next lesson
    </CardTitle>
  );
  if (!events || !now)
    return (
      <Card>
        {title}
        <Skeleton className="h-24" />
      </Card>
    );

  const n = nextLesson(events, today, now);
  return (
    <Card>
      {title}
      {n.state === "now" || n.state === "next" ? (
        <div className={cx("rounded-2xl p-4", n.state === "now" ? "bg-good-soft" : "bg-accent-soft")}>
          <p className={cx("text-[14px] font-semibold uppercase tracking-wide", n.state === "now" ? "text-good" : "text-accent")}>
            {n.state === "now" ? `On now · ends in ${fmtMins(n.minsLeft)}` : `Starts in ${fmtMins(n.minsUntil)}`}
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[34px] font-bold leading-tight tracking-tight">
                <IconMapPin size={24} className="shrink-0 opacity-60" />
                {n.lesson.location || "Room TBC"}
              </p>
              <p className="truncate text-[16px] font-medium">{subjectOf(n.lesson)}</p>
            </div>
            <p className="shrink-0 text-right text-[20px] font-semibold tabular-nums">
              {n.lesson.startTime}
              <span className="block text-[14px] font-normal text-muted">until {n.lesson.endTime}</span>
            </p>
          </div>
          {n.state === "next" && n.laterToday > 0 && (
            <p className="mt-2 text-[14px] text-muted">
              + {n.laterToday} more lesson{n.laterToday > 1 ? "s" : ""} today
            </p>
          )}
        </div>
      ) : n.state === "doneToday" ? (
        <div className="rounded-2xl bg-card-2 p-4">
          <p className="text-[20px] font-semibold">Done for today 🎉</p>
          <Upcoming lesson={n.upcoming} today={today} prefix="Next:" />
        </div>
      ) : (
        <div className="rounded-2xl bg-card-2 p-4">
          <p className="text-[20px] font-semibold">No lessons today</p>
          <Upcoming lesson={n.upcoming} today={today} prefix="Next:" />
        </div>
      )}
    </Card>
  );
}
