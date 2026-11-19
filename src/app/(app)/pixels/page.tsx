"use client";

import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/Icons";
import { Card, IconButton, PageHeader, Segmented, Sheet, Skeleton, cx } from "@/components/ui";
import { saveSettings } from "@/lib/actions";
import { useJournalEntry, usePixels, useSettings } from "@/lib/client";
import { DEFAULT_SETTINGS, MOODS } from "@/lib/constants";
import { formatLong } from "@/lib/dates";
import { MOOD_COLORS, PRODUCTIVITY_COLORS, PRODUCTIVITY_LABELS, type PixelDay } from "@/lib/pixels";
import { useToday } from "@/lib/useToday";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const ymd = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function PixelsPage() {
  const today = useToday();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const { data } = usePixels(year);
  const { data: settings } = useSettings();
  const mode = (settings ?? DEFAULT_SETTINGS).pixelsMode;
  const [picked, setPicked] = useState<string | null>(null);

  const colour = (d?: PixelDay) => {
    if (!d) return "";
    if (mode === "mood") return d.mood ? MOOD_COLORS[d.mood] : "";
    return PRODUCTIVITY_COLORS[d.score];
  };
  const days = data?.days ?? {};
  const counted = Object.values(days).filter((d) => (mode === "mood" ? d.mood : d.score)).length;

  return (
    <>
      <PageHeader title="Year in pixels" subtitle={`${counted} day${counted === 1 ? "" : "s"} coloured in ${year}`} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          value={mode}
          onChange={(v) => saveSettings({ pixelsMode: v })}
          options={[
            { value: "mood", label: "Mood" },
            { value: "productivity", label: "Productivity" },
          ]}
          className="w-64"
        />
        <div className="ml-auto flex items-center">
          <IconButton label="Previous year" onClick={() => setYear((y) => y - 1)}>
            <IconChevronLeft />
          </IconButton>
          <span className="w-14 text-center text-[17px] font-semibold tabular-nums">{year}</span>
          <IconButton label="Next year" onClick={() => setYear((y) => y + 1)} disabled={year >= Number(today.slice(0, 4))} className="disabled:opacity-20">
            <IconChevronRight />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
        <Card className="!p-3 md:!p-4">
          {!data ? (
            <Skeleton className="aspect-[12/31] w-full" />
          ) : (
            <div className="grid grid-cols-[18px_repeat(12,minmax(0,1fr))] gap-[3px]" role="grid" aria-label={`${year} in pixels`}>
              <span />
              {MONTHS.map((m, i) => (
                <span key={i} className="pb-1 text-center text-[12px] font-semibold text-muted">
                  {m}
                </span>
              ))}
              {Array.from({ length: 31 }, (_, r) => (
                <Row key={r} r={r} year={year} days={days} today={today} colour={colour} onPick={setPicked} />
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="mb-3 text-[14px] font-medium text-muted">{mode === "mood" ? "Mood (from your journal)" : "Productivity (tasks + habits)"}</p>
            <ul className="space-y-2">
              {(mode === "mood" ? [...MOODS].reverse().map((m) => ({ c: MOOD_COLORS[m.value], label: `${m.emoji} ${m.label}` })) : [4, 3, 2, 1].map((l) => ({ c: PRODUCTIVITY_COLORS[l], label: PRODUCTIVITY_LABELS[l] }))).map((x) => (
                <li key={x.label} className="flex items-center gap-3 text-[15px]">
                  <span className="h-5 w-5 rounded-[5px]" style={{ background: x.c }} />
                  {x.label}
                </li>
              ))}
              <li className="flex items-center gap-3 text-[15px] text-muted">
                <span className="h-5 w-5 rounded-[5px] bg-card-2" />
                No data
              </li>
            </ul>
            {mode === "productivity" && (
              <p className="mt-3 text-[13px] text-muted">Up to 3 points for tasks done, plus a point each for water, sleep, creative practice and the gym.</p>
            )}
          </Card>
          <p className="px-1 text-[14px] text-muted">Tap any day to see its journal entry and stats.</p>
        </div>
      </div>

      <DaySheet date={picked} day={picked ? days[picked] : undefined} onClose={() => setPicked(null)} />
    </>
  );
}

function Row({
  r,
  year,
  days,
  today,
  colour,
  onPick,
}: {
  r: number;
  year: number;
  days: Record<string, PixelDay>;
  today: string;
  colour: (d?: PixelDay) => string;
  onPick: (d: string) => void;
}) {
  return (
    <>
      <span className="flex items-center justify-end pr-0.5 text-[10px] tabular-nums text-faint">{(r + 1) % 5 === 0 || r === 0 ? r + 1 : ""}</span>
      {Array.from({ length: 12 }, (_, m) => {
        if (r + 1 > daysIn(year, m)) return <span key={m} />;
        const date = ymd(year, m, r + 1);
        const future = date > today;
        const bg = colour(days[date]);
        return (
          <button
            key={m}
            disabled={future}
            onClick={() => onPick(date)}
            aria-label={date}
            className={cx("press press-strong aspect-square rounded-[4px] disabled:opacity-35", !bg && "bg-card-2", date === today && "ring-2 ring-text ring-offset-1 ring-offset-card")}
            style={bg ? { background: bg } : undefined}
          />
        );
      })}
    </>
  );
}

function DaySheet({ date, day, onClose }: { date: string | null; day?: PixelDay; onClose: () => void }) {
  const { data: entry } = useJournalEntry(date ?? "1970-01-01");
  const mood = MOODS.find((m) => m.value === (entry?.mood ?? day?.mood));
  const stats = [
    { label: "Tasks done", value: day?.tasks ?? 0, emoji: "✅" },
    { label: "Water", value: `${day?.water ?? 0} glasses`, emoji: "💧" },
    { label: "Sleep", value: day?.sleep ? `${day.sleep}h` : "–", emoji: "😴" },
    { label: "Creative", value: `${day?.creative ?? 0} min`, emoji: "🎨" },
    { label: "Gym", value: day?.gym ? `${day.gym} session${day.gym > 1 ? "s" : ""}` : "–", emoji: "💪" },
    { label: "Productivity", value: PRODUCTIVITY_LABELS[day?.score ?? 0], emoji: "⭐" },
  ];
  return (
    <Sheet open={!!date} onClose={onClose} title={date ? formatLong(date) : ""}>
      <div className="space-y-4 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-card-2 p-3">
          <span className="text-[32px]">{mood?.emoji ?? "·"}</span>
          <span className="text-[17px] font-medium">{mood ? `Feeling ${mood.label.toLowerCase()}` : "No mood logged"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-card-2 p-3">
              <p className="text-[13px] text-muted">
                {s.emoji} {s.label}
              </p>
              <p className="text-[18px] font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1 text-[14px] font-medium text-muted">Journal</p>
          {entry === undefined ? (
            <Skeleton className="h-16" />
          ) : entry?.body ? (
            <p className="whitespace-pre-line rounded-2xl bg-card-2 p-3 text-[16px] leading-relaxed">{entry.body}</p>
          ) : (
            <p className="text-[15px] text-faint">No journal entry for this day.</p>
          )}
        </div>
      </div>
    </Sheet>
  );
}
