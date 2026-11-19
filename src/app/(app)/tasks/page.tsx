"use client";

import { useMemo, useState } from "react";
import type { InboxItem, Task } from "@/db/schema";
import { IconInbox, IconPlus, IconTrash } from "@/components/Icons";
import { QuickCapture } from "@/components/QuickCapture";
import { TaskRow, TaskSheet } from "@/components/tasks";
import { Button, Card, CardTitle, Empty, IconButton, PageHeader, Sheet, Skeleton, cx } from "@/components/ui";
import { addDays } from "@/lib/dates";
import { deleteInbox, inboxToTask } from "@/lib/actions";
import { useInbox, useTasks } from "@/lib/client";
import { categoryColor, useCategoryNames } from "@/lib/categories";
import { bucketOf, sortTasks, type Bucket } from "@/lib/tasks";
import { useToday } from "@/lib/useToday";

const SECTIONS: { key: Bucket; title: string; tone?: string }[] = [
  { key: "overdue", title: "Overdue", tone: "text-danger" },
  { key: "today", title: "Today" },
  { key: "week", title: "This week" },
  { key: "later", title: "Later" },
];

export default function TasksPage() {
  const today = useToday();
  const { data: tasks } = useTasks();
  const { data: inbox } = useInbox();
  const [filter, setFilter] = useState<string | null>(null);
  const [edit, setEdit] = useState<Task | null | undefined>(undefined);
  const [showDone, setShowDone] = useState(false);
  const [convert, setConvert] = useState<InboxItem | null>(null);
  const CATEGORY_NAMES = useCategoryNames();

  const visible = useMemo(() => (tasks ?? []).filter((t) => !filter || t.category === filter), [tasks, filter]);
  const groups = useMemo(() => {
    const g: Record<Bucket, Task[]> = { overdue: [], today: [], week: [], later: [] };
    for (const t of visible.filter((t) => !t.done)) g[bucketOf(t, today)].push(t);
    for (const k of Object.keys(g) as Bucket[]) g[k].sort(sortTasks);
    return g;
  }, [visible, today]);
  const done = visible.filter((t) => t.done).sort((a, b) => (b.completedOn ?? "").localeCompare(a.completedOn ?? ""));

  return (
    <>
      <PageHeader
        title="Tasks"
        action={
          <Button onClick={() => setEdit(null)} className="mb-1">
            <IconPlus size={20} /> New
          </Button>
        }
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {[null, ...CATEGORY_NAMES].map((c) => (
          <button
            key={c ?? "all"}
            onClick={() => setFilter(c)}
            className={cx(
              "flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition",
              filter === c ? "bg-text text-bg" : "bg-card text-text shadow-card",
            )}
          >
            {c && <span className="h-2.5 w-2.5 rounded-full" style={{ background: categoryColor(c).dot }} />}
            {c ?? "All"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {!tasks ? (
            <Card>
              <Skeleton className="h-40" />
            </Card>
          ) : (
            SECTIONS.map((s, i) =>
              groups[s.key].length === 0 && s.key !== "today" ? null : (
                <Card key={s.key} delay={i * 40}>
                  <CardTitle>
                    <span className={s.tone}>{s.title}</span>
                    <span className="text-faint">{groups[s.key].length}</span>
                  </CardTitle>
                  {groups[s.key].length === 0 ? (
                    <Empty>Nothing due today</Empty>
                  ) : (
                    <div className="divide-y divide-line">
                      {groups[s.key].map((t) => (
                        <TaskRow key={t.id} task={t} onEdit={setEdit} />
                      ))}
                    </div>
                  )}
                </Card>
              ),
            )
          )}
          {done.length > 0 && (
            <Card>
              <button onClick={() => setShowDone((v) => !v)} className="flex min-h-8 w-full items-center justify-between text-[15px] font-semibold uppercase tracking-wide text-muted">
                Completed (last 2 weeks) <span className="text-faint">{showDone ? "Hide" : done.length}</span>
              </button>
              {showDone && (
                <div className="mt-2 divide-y divide-line">
                  {done.map((t) => (
                    <TaskRow key={t.id} task={t} onEdit={setEdit} />
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div id="inbox" className="scroll-mt-4 space-y-3 lg:sticky lg:top-6 lg:self-start">
          <QuickCapture />
          <Card>
            <CardTitle icon={<IconInbox size={18} />}>
              Inbox <span className="text-faint">{inbox?.length ?? ""}</span>
            </CardTitle>
            {!inbox ? (
              <Skeleton className="h-16" />
            ) : inbox.length === 0 ? (
              <Empty emoji="📭">Inbox zero</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {inbox.map((item) => (
                  <li key={item.id} className="anim-rise flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 break-words text-[16px]">{item.text}</span>
                    <Button size="sm" variant="secondary" onClick={() => setConvert(item)}>
                      → Task
                    </Button>
                    <IconButton label="Delete" onClick={() => deleteInbox(item.id)} className="text-faint">
                      <IconTrash size={19} />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <TaskSheet open={edit !== undefined} onClose={() => setEdit(undefined)} task={edit} />
      <ConvertSheet item={convert} onClose={() => setConvert(null)} />
    </>
  );
}

/** One-tap conversion: pick when it's due and it becomes a task. */
function ConvertSheet({ item, onClose }: { item: InboxItem | null; onClose: () => void }) {
  const today = useToday();
  const [category, setCategory] = useState<string>("Personal");
  const CATEGORY_NAMES = useCategoryNames();
  const go = (due: string | null) => {
    if (!item) return;
    inboxToTask(item, { dueDate: due, category });
    onClose();
  };
  return (
    <Sheet open={!!item} onClose={onClose} title="Make it a task">
      <p className="mb-4 rounded-xl bg-card-2 p-3 text-[17px]">{item?.text}</p>
      <p className="mb-2 text-[14px] font-medium text-muted">Category</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORY_NAMES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="min-h-10 rounded-full border-2 px-3.5 text-[15px] font-medium"
            style={{ borderColor: category === c ? categoryColor(c).dot : "var(--line)", background: category === c ? categoryColor(c).soft : "transparent" }}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mb-2 text-[14px] font-medium text-muted">When?</p>
      <div className="grid grid-cols-2 gap-2 pb-2">
        <Button size="lg" onClick={() => go(today)}>Today</Button>
        <Button size="lg" variant="secondary" onClick={() => go(addDays(today, 1))}>Tomorrow</Button>
        <Button size="lg" variant="secondary" onClick={() => go(addDays(today, 7))}>Next week</Button>
        <Button size="lg" variant="secondary" onClick={() => go(null)}>Someday</Button>
      </div>
    </Sheet>
  );
}
