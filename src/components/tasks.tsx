"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/db/schema";
import { addTask, deleteTask, updateTask, type TaskDraft } from "@/lib/actions";
import { PRIORITIES } from "@/lib/constants";
import { categoryColor, useCategoryNames } from "@/lib/categories";
import { addDays, relativeDay } from "@/lib/dates";
import { useToday } from "@/lib/useToday";
import { IconPin } from "./Icons";
import { Button, CategoryChip, Check, Field, Segmented, Sheet, cx } from "./ui";

export function TaskRow({ task, onEdit, compact }: { task: Task; onEdit: (t: Task) => void; compact?: boolean }) {
  const today = useToday();
  const overdue = !task.done && task.dueDate && task.dueDate < today;
  return (
    <div className={cx("group flex items-start gap-3 py-2.5", task.done && "opacity-55")}>
      <div className="pt-0.5">
        <Check
          checked={task.done}
          onChange={(v) => updateTask(task.id, { done: v })}
          label={`Complete ${task.title}`}
          color={categoryColor(task.category).dot}
        />
      </div>
      <button onClick={() => onEdit(task)} className="min-w-0 flex-1 text-left">
        <div className={cx("text-[17px] leading-snug transition-colors", task.done && "text-muted line-through")}>
          {task.pinned && !task.done && <IconPin size={14} className="mr-1 inline -translate-y-px text-warn" fill="currentColor" />}
          {task.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-muted">
          {task.dueDate && <span className={cx(overdue && "font-medium text-danger")}>{relativeDay(task.dueDate, today)}</span>}
          {task.priority === 3 && <span className="font-medium text-warn">High</span>}
          {task.isAssignment && <span className="font-medium text-accent">📚 Assignment</span>}
          {!compact && <CategoryChip category={task.category} />}
          {compact && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(task.category).dot }} />
              {task.category}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

const empty = (due: string | null): TaskDraft => ({ title: "", notes: "", dueDate: due, priority: 2, category: "Personal", pinned: false, isAssignment: false });

export function TaskSheet({
  open,
  onClose,
  task,
  defaultDue = null,
}: {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultDue?: string | null;
}) {
  const today = useToday();
  const [d, setD] = useState<TaskDraft>(empty(defaultDue));
  const CATEGORY_NAMES = useCategoryNames();
  useEffect(() => {
    if (open) setD(task ? { ...task } : empty(defaultDue));
  }, [open, task, defaultDue]);

  const set = <K extends keyof TaskDraft>(k: K, v: TaskDraft[K]) => setD((s) => ({ ...s, [k]: v }));
  const save = () => {
    if (!d.title.trim()) return;
    const payload = { title: d.title.trim(), notes: d.notes, dueDate: d.dueDate || null, priority: d.priority, category: d.category, pinned: d.pinned, isAssignment: d.isAssignment };
    if (task) updateTask(task.id, payload);
    else addTask(payload);
    onClose();
  };

  const quick = [
    { label: "Today", v: today },
    { label: "Tomorrow", v: addDays(today, 1) },
    { label: "Next week", v: addDays(today, 7) },
    { label: "None", v: null },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      footer={
        <div className="flex gap-2">
          {task && (
            <Button
              variant="danger"
              onClick={() => {
                deleteTask(task.id);
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          <Button className="flex-1" size="lg" onClick={save} disabled={!d.title.trim()}>
            {task ? "Save" : "Add task"}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          className="field text-[18px] font-medium"
          placeholder="What needs doing?"
          value={d.title}
          onChange={(e) => set("title", e.target.value)}
          autoFocus={!task}
          enterKeyHint="done"
        />
        <Field label="Due">
          <div className="mb-2 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                type="button"
                key={q.label}
                onClick={() => set("dueDate", q.v)}
                className={cx(
                  "min-h-9 rounded-full px-3.5 text-[15px] font-medium transition",
                  (d.dueDate ?? null) === q.v ? "bg-accent text-white" : "bg-card-2 text-text",
                )}
              >
                {q.label}
              </button>
            ))}
          </div>
          <input type="date" className="field" value={d.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value || null)} />
        </Field>
        <Field label="Priority">
          <Segmented value={d.priority ?? 2} onChange={(v) => set("priority", v)} options={[...PRIORITIES].reverse()} />
        </Field>
        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_NAMES.map((c) => {
              const col = categoryColor(c);
              const on = d.category === c;
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => set("category", c)}
                  className="min-h-10 rounded-full border-2 px-3.5 text-[15px] font-medium transition"
                  style={{ background: on ? col.soft : "transparent", borderColor: on ? col.dot : "var(--line)", color: on ? col.dot : "var(--text)" }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>
        <label className="flex min-h-12 items-center justify-between rounded-xl bg-card-2 px-4">
          <span className="flex items-center gap-2">
            <IconPin size={18} className="text-warn" /> Pin to today's top 3
          </span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={!!d.pinned} onChange={(e) => set("pinned", e.target.checked)} />
        </label>
        <label className="flex min-h-12 items-center justify-between rounded-xl bg-card-2 px-4">
          <span>
            📚 It's an assignment
            <span className="block text-[13px] text-muted">Shows a days-left countdown on Today</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={!!d.isAssignment} onChange={(e) => set("isAssignment", e.target.checked)} />
        </label>
        <Field label="Notes">
          <textarea className="field min-h-24" value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" />
        </Field>
      </form>
    </Sheet>
  );
}
