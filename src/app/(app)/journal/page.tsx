"use client";

import { useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconSearch } from "@/components/Icons";
import { Card, CardTitle, Empty, IconButton, PageHeader, Skeleton, cx } from "@/components/ui";
import { saveJournal } from "@/lib/actions";
import { useJournalEntry, useJournalList } from "@/lib/client";
import { MOODS } from "@/lib/constants";
import { addDays, formatLong, formatShort, relativeDay } from "@/lib/dates";
import { useToday } from "@/lib/useToday";

export default function JournalPage() {
  const today = useToday();
  const [date, setDate] = useState<string | null>(null);
  const day = date ?? today;
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data: list } = useJournalList(query);

  return (
    <>
      <PageHeader title="Journal" subtitle={relativeDay(day, today)} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Editor key={day} date={day} today={today} onNav={(n) => setDate(addDays(day, n) >= today ? null : addDays(day, n))} />

        <Card>
          <CardTitle>Past entries</CardTitle>
          <label className="relative mb-3 block">
            <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="field pl-10" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
          </label>
          {!list ? (
            <Skeleton className="h-32" />
          ) : list.length === 0 ? (
            <Empty>{query ? "No matches" : "No entries yet"}</Empty>
          ) : (
            <ul className="-mx-2 max-h-[60dvh] overflow-y-auto">
              {list.map((e) => (
                <li key={e.date}>
                  <button
                    onClick={() => {
                      setDate(e.date === today ? null : e.date);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={cx("press press-subtle flex w-full gap-3 rounded-xl p-2 text-left hover:bg-card-2", e.date === day && "bg-accent-soft")}
                  >
                    <span className="w-7 text-[20px]">{MOODS.find((m) => m.value === e.mood)?.emoji ?? "·"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-muted">{formatShort(e.date)}</span>
                      <span className="line-clamp-2 text-[15px]">{e.body || <span className="text-faint">Mood only</span>}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Editor({ date, today, onNav }: { date: string; today: string; onNav: (n: number) => void }) {
  const { data: entry, isLoading } = useJournalEntry(date);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const dirty = useRef(false);
  const version = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adopt server text (e.g. written on another device) unless we have unsaved edits.
  useEffect(() => {
    if (!dirty.current && entry !== undefined) setBody(entry?.body ?? "");
  }, [entry]);

  const flush = async (text: string) => {
    const v = version.current;
    setStatus("saving");
    await saveJournal(date, { body: text });
    // Only clear "dirty" if nothing was typed while this save was in flight.
    if (version.current === v) {
      dirty.current = false;
      setStatus("saved");
    }
  };
  const onChange = (text: string) => {
    setBody(text);
    version.current++;
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(text), 700);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Previous day" onClick={() => onNav(-1)}>
          <IconChevronLeft />
        </IconButton>
        <span className="text-[17px] font-semibold">{formatLong(date)}</span>
        <IconButton label="Next day" onClick={() => onNav(1)} disabled={date >= today} className="disabled:opacity-20">
          <IconChevronRight />
        </IconButton>
      </div>

      <p className="mb-2 text-[14px] font-medium text-muted">How was today? (optional)</p>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {MOODS.map((m) => {
          const on = entry?.mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => saveJournal(date, { mood: on ? null : m.value })}
              className={cx("press press-strong flex min-h-16 flex-col items-center justify-center rounded-2xl text-[12px] font-medium", on ? "bg-accent-soft text-accent ring-2 ring-accent" : "bg-card-2 text-muted")}
              aria-pressed={on}
            >
              <span key={String(on)} className={cx("text-[26px]", on && "anim-pop")}>
                {m.emoji}
              </span>
              {m.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Skeleton className="h-60" />
      ) : (
        <textarea
          className="field min-h-[40dvh] flex-1 resize-none leading-relaxed"
          placeholder="What's on your mind?"
          value={body}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => dirty.current && (clearTimeout(timer.current), flush(body))}
        />
      )}
      <p className="mt-2 h-5 text-right text-[13px] text-faint">{status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : ""}</p>
    </Card>
  );
}
