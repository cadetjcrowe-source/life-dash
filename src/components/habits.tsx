"use client";

import { useState } from "react";
import useSWR from "swr";
import type { HabitEntry, Settings } from "@/db/schema";
import { deleteHabit, habitsKey, logHabit } from "@/lib/actions";
import { CREATIVE_TYPES, DEFAULT_SETTINGS } from "@/lib/constants";
import { formatWeekdayShort } from "@/lib/dates";
import { CELEBRATIONS, HABIT_META, dayValue, gymNudge, gymThisMonth, isHit, target, type Kind } from "@/lib/habits";
import { useSettings } from "@/lib/client";
import { useToday } from "@/lib/useToday";
import { IconClose, IconMinus, IconPlus } from "./Icons";
import { toast } from "./Toast";
import { Button, Confetti, Field, NumericText, Sheet, cx } from "./ui";

/** Shared habit data for the last ~3 months + settings. */
export function useHabitData() {
  const today = useToday();
  const { data: entries, isLoading } = useSWR<HabitEntry[]>(habitsKey(today));
  const { data: settings } = useSettings();
  return { today, entries: entries ?? [], settings: settings ?? DEFAULT_SETTINGS, isLoading };
}

function Ring({ value, max, color, children }: { value: number; max: number; color: string; children: React.ReactNode }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, max ? value / max : 0);
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--card-2)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset var(--dur-smooth) var(--spring-smooth)" }}
        />
      </svg>
      <span className={cx("text-[20px]", pct >= 1 && "anim-pop")} key={pct >= 1 ? "done" : "todo"}>
        {children}
      </span>
    </div>
  );
}

function Stepper({ onMinus, onPlus, label, children }: { onMinus: () => void; onPlus: () => void; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onMinus} aria-label={`Less ${label}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-card-2 text-muted transition press press-strong">
        <IconMinus size={20} />
      </button>
      <span className="min-w-12 text-center text-[17px] font-semibold tabular-nums">{children}</span>
      <button onClick={onPlus} aria-label={`More ${label}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent transition press press-strong">
        <IconPlus size={20} />
      </button>
    </div>
  );
}

function Row({ kind, value, settings, children, sub }: { kind: Kind; value: number; settings: Settings; children: React.ReactNode; sub: React.ReactNode }) {
  const m = HABIT_META[kind];
  return (
    <div className="flex items-center gap-3 py-2">
      <Ring value={value} max={target(kind, settings)} color={m.color}>
        {m.emoji}
      </Ring>
      <div className="min-w-0 flex-1">
        <div className="text-[17px] font-medium">{m.label}</div>
        <div className="text-[14px] text-muted">{sub}</div>
      </div>
      {children}
    </div>
  );
}

/** The four habits for one day — used on Today and the Habits page. */
export function HabitDay({ date, entries, settings, showNudge = true }: { date: string; entries: HabitEntry[]; settings: Settings; showNudge?: boolean }) {
  const today = useToday();
  const [creativeOpen, setCreativeOpen] = useState(false);
  const [gymOpen, setGymOpen] = useState(false);
  const [burst, setBurst] = useState(0);

  const water = dayValue(entries, date, "water");
  const sleep = dayValue(entries, date, "sleep");
  const creative = dayValue(entries, date, "creative");
  const gym = dayValue(entries, date, "gym");
  const creativeSessions = entries.filter((e) => e.date === date && e.kind === "creative");
  const gymSessions = entries.filter((e) => e.date === date && e.kind === "gym");
  const nudge = showNudge && settings.gymNudge && date === today && gym === 0 ? gymNudge(entries, today) : null;

  const setWater = (v: number) => {
    const n = Math.max(0, v);
    logHabit({ date, kind: "water", value: n });
    if (n === settings.waterTarget && v > water) {
      navigator.vibrate?.(15);
      toast("Water goal hit 💧");
    }
  };
  const setSleep = (v: number) => logHabit({ date, kind: "sleep", value: Math.max(0, Math.min(16, v)) });

  return (
    <div className="divide-y divide-line">
      <Row kind="water" value={water} settings={settings} sub={<><NumericText value={water} /> of {settings.waterTarget} glasses</>}>
        <div className="flex items-center gap-1">
          {water > 0 && (
            <button onClick={() => setWater(water - 1)} aria-label="Remove a glass" className="flex h-11 w-11 items-center justify-center rounded-full text-muted transition press press-strong">
              <IconMinus size={18} />
            </button>
          )}
          <button
            onClick={() => setWater(water + 1)}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-[#4aa8d8]/15 px-4 text-[16px] font-semibold text-[#3b93c2] transition press press-strong dark:text-[#7cc4ea]"
          >
            <IconPlus size={18} /> Glass
          </button>
        </div>
      </Row>

      <Row kind="sleep" value={sleep} settings={settings} sub={sleep ? `Target ${settings.sleepTarget}h` : "How long did you sleep?"}>
        <Stepper label="sleep" onMinus={() => setSleep((sleep || settings.sleepTarget) - 0.5)} onPlus={() => setSleep((sleep || settings.sleepTarget - 0.5) + 0.5)}>
          {sleep ? <NumericText value={sleep}>{sleep}h</NumericText> : "–"}
        </Stepper>
      </Row>

      <Row
        kind="creative"
        value={creative}
        settings={settings}
        sub={creative ? `${creative} min · ${[...new Set(creativeSessions.map((s) => CREATIVE_TYPES.find((t) => t.value === s.subtype)?.label.split(" ")[0]))].join(", ")}` : "Music, editing or photography"}
      >
        <button onClick={() => setCreativeOpen(true)} className="flex min-h-11 items-center gap-1.5 rounded-full bg-[#c77dbb]/15 px-4 text-[16px] font-semibold text-[#a9609d] transition press press-strong dark:text-[#e0a3d6]">
          <IconPlus size={18} /> Log
        </button>
      </Row>

      <div className="relative">
        <Row
          kind="gym"
          value={gym}
          settings={settings}
          sub={gym ? (gym > 1 ? `${gym} sessions today 🔥` : "Session done — nice one!") : `${gymThisMonth(entries, today)} this month · optional`}
        >
          <button
            onClick={() => setGymOpen(true)}
            className={cx(
              "relative flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[16px] font-semibold transition press press-strong",
              gym ? "bg-good text-white" : "bg-good-soft text-good",
            )}
          >
            {gym ? "✓ Went" : "I went!"}
            <Confetti trigger={burst} />
          </button>
        </Row>
        {nudge && <p className="-mt-1 mb-2 ml-[60px] rounded-xl bg-good-soft px-3 py-2 text-[14px] text-good">{nudge}</p>}
      </div>

      <CreativeSheet open={creativeOpen} onClose={() => setCreativeOpen(false)} date={date} sessions={creativeSessions} />
      <GymSheet
        open={gymOpen}
        onClose={() => setGymOpen(false)}
        sessions={gymSessions}
        onLog={(minutes) => {
          logHabit({ date, kind: "gym", value: minutes });
          setBurst((b) => b + 1);
          navigator.vibrate?.([10, 40, 10]);
          toast(CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]);
          setGymOpen(false);
        }}
      />
    </div>
  );
}

function CreativeSheet({ open, onClose, date, sessions }: { open: boolean; onClose: () => void; date: string; sessions: HabitEntry[] }) {
  const [type, setType] = useState<string>("music");
  const [minutes, setMinutes] = useState(30);
  const [note, setNote] = useState("");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Creative practice"
      footer={
        <Button
          size="lg"
          className="w-full"
          disabled={minutes <= 0}
          onClick={() => {
            logHabit({ date, kind: "creative", value: minutes, subtype: type, note });
            toast(`${minutes} min logged 🎨`);
            setNote("");
            onClose();
          }}
        >
          Log {minutes} min
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {CREATIVE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cx(
                "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-[14px] font-medium transition",
                type === t.value ? "border-accent bg-accent-soft" : "border-transparent bg-card-2",
              )}
            >
              <span className="text-2xl">{t.emoji}</span>
              {t.label.split(" ")[0]}
            </button>
          ))}
        </div>
        <Field label="Minutes">
          <div className="mb-2 flex flex-wrap gap-2">
            {[10, 15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={cx("min-h-10 min-w-14 rounded-full px-3 text-[15px] font-medium", minutes === m ? "bg-accent text-white" : "bg-card-2")}
              >
                {m}
              </button>
            ))}
          </div>
          <input type="number" inputMode="numeric" min={1} max={600} className="field" value={minutes || ""} onChange={(e) => setMinutes(Number(e.target.value))} />
        </Field>
        <Field label="What did you work on?">
          <input className="field" placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {sessions.length > 0 && (
          <div>
            <p className="mb-1 text-[14px] font-medium text-muted">Logged this day</p>
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 text-[15px]">
                <span>
                  {CREATIVE_TYPES.find((t) => t.value === s.subtype)?.emoji} {s.value} min {s.note && <span className="text-muted">· {s.note}</span>}
                </span>
                <button onClick={() => deleteHabit(s.id)} aria-label="Remove session" className="flex h-10 w-10 items-center justify-center text-faint">
                  <IconClose size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function GymSheet({ open, onClose, sessions, onLog }: { open: boolean; onClose: () => void; sessions: HabitEntry[]; onLog: (m: number) => void }) {
  const [minutes, setMinutes] = useState(0);
  return (
    <Sheet open={open} onClose={onClose} title="Gym session 💪">
      <div className="space-y-4 pb-2">
        <p className="text-muted">Any session counts, however short. How long were you there? (Optional.)</p>
        <div className="flex flex-wrap gap-2">
          {[0, 15, 30, 45, 60, 90].map((m) => (
            <button key={m} onClick={() => setMinutes(m)} className={cx("min-h-11 min-w-16 rounded-full px-4 text-[15px] font-medium", minutes === m ? "bg-good text-white" : "bg-card-2")}>
              {m === 0 ? "Skip" : `${m} min`}
            </button>
          ))}
        </div>
        <Button size="lg" className="w-full !bg-good" onClick={() => onLog(minutes)}>
          Log session 🎉
        </Button>
        {sessions.length > 0 && (
          <div>
            <p className="mb-1 text-[14px] font-medium text-muted">Logged this day</p>
            {sessions.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 text-[15px]">
                <span>
                  Session {i + 1}
                  {s.value ? ` · ${s.value} min` : ""}
                </span>
                <button onClick={() => deleteHabit(s.id)} aria-label="Remove session" className="flex h-10 w-10 items-center justify-center text-faint">
                  <IconClose size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Seven-day bar chart for one habit, with a dashed target line. */
export function WeekBars({
  data,
  color,
  goal,
  unit,
  settingsHit,
  label = (d) => formatWeekdayShort(d).slice(0, 2),
}: {
  label?: (date: string) => string;
  data: { date: string; value: number }[];
  color: string;
  goal?: number;
  unit: string;
  settingsHit: (v: number) => boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1) * 1.1;
  const H = 96;
  return (
    <div>
      <div className="relative" style={{ height: H }} onMouseLeave={() => setActive(null)}>
        {goal ? (
          <div className="absolute inset-x-0 border-t border-dashed border-faint" style={{ bottom: (goal / max) * H }} aria-hidden>
            <span className="absolute -top-2.5 right-0 bg-card pl-1 text-[11px] text-muted">
              {goal}
              {unit === "h" ? "h" : ""}
            </span>
          </div>
        ) : null}
        <div className="absolute inset-0 flex items-end gap-[2px] pr-6">
          {data.map((d, i) => (
            <button
              key={d.date}
              className="relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(active === i ? null : i)}
              aria-label={`${label(d.date)}: ${d.value} ${unit}`}
            >
              <span
                className="w-full max-w-7 rounded-t-[4px] transition-[height] spring-smooth"
                style={{
                  height: d.value ? Math.max(4, (d.value / max) * H) : 2,
                  transitionDelay: `${i * 30}ms`,
                  background: d.value ? color : "var(--line)",
                  opacity: d.value && !settingsHit(d.value) ? 0.45 : 1,
                }}
              />
              {active === i && (
                <span className="absolute -top-7 z-10 whitespace-nowrap rounded-lg bg-text px-2 py-0.5 text-[12px] font-medium text-bg">
                  {d.value} {unit}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex gap-[2px] pr-6">
        {data.map((d, i) => (
          <span key={d.date} className={cx("flex-1 text-center text-[12px]", i === data.length - 1 ? "font-semibold text-text" : "text-muted")}>
            {label(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

export { isHit };
