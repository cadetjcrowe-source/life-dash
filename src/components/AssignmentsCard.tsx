"use client";

import Link from "next/link";
import type { Task } from "@/db/schema";
import { diffDays, formatShort } from "@/lib/dates";
import { useTasks } from "@/lib/client";
import { useToday } from "@/lib/useToday";
import { Card, CardTitle, Empty, Skeleton, cx } from "./ui";

/** Nearest assignment deadlines as big "X days left" cards. Amber at ≤7 days, red at ≤2. */
export function AssignmentsCard({ onOpen }: { onOpen: (t: Task) => void }) {
  const today = useToday();
  const { data: tasks } = useTasks();
  const list = (tasks ?? [])
    .filter((t) => t.isAssignment && !t.done && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 3);

  return (
    <Card>
      <CardTitle action={<Link href="/tasks" className="text-[15px] font-medium text-accent">All</Link>}>📚 Assignments</CardTitle>
      {!tasks ? (
        <Skeleton className="h-28" />
      ) : list.length === 0 ? (
        <Empty emoji="🎓">No assignments due. Mark a task as an assignment to count it down here.</Empty>
      ) : (
        <div className="grid gap-2">
          {list.map((t) => {
            const days = diffDays(today, t.dueDate!);
            const tone = days <= 2 ? "danger" : days <= 7 ? "warn" : "muted";
            const label = days < 0 ? `${-days} day${days === -1 ? "" : "s"} overdue` : days === 0 ? "Due today" : days === 1 ? "1 day left" : `${days} days left`;
            return (
              <button
                key={t.id}
                onClick={() => onOpen(t)}
                className={cx(
                  "press press-subtle flex items-center gap-4 rounded-2xl p-4 text-left",
                  tone === "danger" && "bg-danger-soft",
                  tone === "warn" && "bg-warn-soft",
                  tone === "muted" && "bg-card-2",
                )}
              >
                <span
                  className={cx(
                    "min-w-[64px] text-center text-[40px] font-bold leading-none tabular-nums",
                    tone === "danger" && "text-danger",
                    tone === "warn" && "text-warn",
                    tone === "muted" && "text-text",
                  )}
                >
                  {days <= 0 ? "!" : days}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-[14px] font-semibold uppercase tracking-wide", tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-muted")}>{label}</span>
                  <span className="block truncate text-[17px] font-medium">{t.title}</span>
                  <span className="text-[14px] text-muted">
                    Due {formatShort(t.dueDate!)} · {t.category}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
