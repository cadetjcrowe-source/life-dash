"use client";

import { useEffect, useState } from "react";
import type { CalEvent } from "@/db/schema";
import { addEvent, deleteEvent, skipOccurrence, updateEvent, type EventDraft } from "@/lib/actions";
import { REPEATS } from "@/lib/constants";
import { categoryColor, useCategoryNames } from "@/lib/categories";
import { formatShort } from "@/lib/dates";
import type { Occurrence } from "@/lib/recurrence";
import { useToday } from "@/lib/useToday";
import { IconMapPin, IconRepeat } from "./Icons";
import { Button, Field, Sheet, cx } from "./ui";

export function timeRange(e: Pick<CalEvent, "startTime" | "endTime">) {
  if (!e.startTime) return "All day";
  return e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime;
}

export function EventItem({ ev, onClick, now }: { ev: Occurrence; onClick: () => void; now?: string }) {
  const col = categoryColor(ev.category);
  const past = now && ev.endTime && ev.endTime <= now;
  const live = now && ev.startTime && ev.startTime <= now && (!ev.endTime || ev.endTime > now);
  return (
    <button
      onClick={onClick}
      className={cx("flex w-full items-stretch gap-3 rounded-2xl p-3 text-left transition press", past && "opacity-50")}
      style={{ background: col.soft }}
    >
      <span className="w-1 shrink-0 rounded-full" style={{ background: col.dot }} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[14px] font-medium" style={{ color: col.dot }}>
          {timeRange(ev)}
          {live && <span className="rounded-full bg-good px-1.5 text-[11px] font-bold uppercase tracking-wide text-white">Now</span>}
          {ev.repeat !== "none" && <IconRepeat size={13} />}
        </span>
        <span className="block truncate text-[17px] font-medium">{ev.title}</span>
        {ev.location && (
          <span className="mt-0.5 flex items-center gap-1 truncate text-[14px] text-muted">
            <IconMapPin size={13} /> {ev.location}
          </span>
        )}
      </span>
    </button>
  );
}

const blank = (date: string): EventDraft => ({
  title: "",
  date,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  category: "Personal",
  repeat: "none",
  repeatUntil: null,
  excludedDates: [],
  kind: "event",
});

export function EventSheet({
  open,
  onClose,
  event,
  occurrenceDate,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  event?: CalEvent | null;
  occurrenceDate?: string;
  defaultDate?: string;
}) {
  const today = useToday();
  const [d, setD] = useState<EventDraft>(blank(defaultDate ?? today));
  const [allDay, setAllDay] = useState(false);
  const CATEGORY_NAMES = useCategoryNames();
  useEffect(() => {
    if (!open) return;
    const base = event ? { ...event } : blank(defaultDate ?? today);
    setD(base);
    setAllDay(!base.startTime);
  }, [open, event, defaultDate, today]);
  const set = <K extends keyof EventDraft>(k: K, v: EventDraft[K]) => setD((s) => ({ ...s, [k]: v }));

  const save = () => {
    if (!d.title.trim()) return;
    const payload: EventDraft = {
      ...d,
      title: d.title.trim(),
      startTime: allDay ? null : d.startTime || null,
      endTime: allDay ? null : d.endTime || null,
      repeatUntil: d.repeat === "none" ? null : d.repeatUntil || null,
    };
    if (event) {
      const { excludedDates: _x, ...patch } = payload;
      updateEvent(event.id, patch);
    } else addEvent(payload);
    onClose();
  };

  const repeating = event && event.repeat !== "none";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={event ? "Edit event" : "New event"}
      footer={
        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={save} disabled={!d.title.trim()}>
            {event ? "Save" : "Add event"}
          </Button>
          {event && (
            <div className="flex gap-2">
              {repeating && occurrenceDate && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    skipOccurrence(event, occurrenceDate);
                    onClose();
                  }}
                >
                  Skip {formatShort(occurrenceDate)}
                </Button>
              )}
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  deleteEvent(event.id);
                  onClose();
                }}
              >
                {repeating ? "Delete series" : "Delete"}
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <input className="field text-[18px] font-medium" placeholder="Title" value={d.title} onChange={(e) => set("title", e.target.value)} autoFocus={!event} />
        <Field label={repeating ? "Starts on" : "Date"}>
          <input type="date" className="field" value={d.date} onChange={(e) => e.target.value && set("date", e.target.value)} />
        </Field>
        <label className="flex min-h-12 items-center justify-between rounded-xl bg-card-2 px-4">
          All day
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        </label>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <input type="time" className="field" value={d.startTime ?? ""} onChange={(e) => set("startTime", e.target.value)} />
            </Field>
            <Field label="End">
              <input type="time" className="field" value={d.endTime ?? ""} onChange={(e) => set("endTime", e.target.value)} />
            </Field>
          </div>
        )}
        <Field label="Location">
          <input className="field" placeholder="Optional" value={d.location} onChange={(e) => set("location", e.target.value)} />
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
                  className="flex min-h-10 items-center gap-2 rounded-full border-2 px-3.5 text-[15px] font-medium transition"
                  style={{ background: on ? col.soft : "transparent", borderColor: on ? col.dot : "var(--line)" }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.dot }} />
                  {c}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Repeat">
          <select className="field" value={d.repeat} onChange={(e) => set("repeat", e.target.value)}>
            {REPEATS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        {d.repeat !== "none" && (
          <Field label="Until" hint="Leave empty to repeat forever (e.g. end of term)">
            <input type="date" className="field" value={d.repeatUntil ?? ""} onChange={(e) => set("repeatUntil", e.target.value || null)} />
          </Field>
        )}
      </div>
    </Sheet>
  );
}
