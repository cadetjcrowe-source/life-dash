"use client";

import { useWeather } from "@/lib/client";
import { formatWeekdayShort } from "@/lib/dates";
import { describe } from "@/lib/weather";
import { Card, Pill, Skeleton } from "./ui";

export function WeatherCard({ delay }: { delay?: number }) {
  const { data: w, error } = useWeather();
  if (error)
    return (
      <Card delay={delay}>
        <p className="text-muted">Weather unavailable right now.</p>
      </Card>
    );
  if (!w)
    return (
      <Card delay={delay}>
        <Skeleton className="h-28" />
      </Card>
    );
  const now = describe(w.current.code, w.current.isDay);
  const t = (time: string | null) => time?.slice(11, 16) ?? "–";
  return (
    <Card delay={delay}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-muted">Ramsey</p>
          <div className="flex items-center gap-2">
            <span className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">{Math.round(w.current.temp)}°</span>
            <span className="text-[40px] leading-none">{now.icon}</span>
          </div>
          <p className="mt-1 text-[15px] text-muted">
            {now.label} · feels {Math.round(w.current.feelsLike)}° · wind {Math.round(w.current.wind)} km/h
          </p>
        </div>
        <div className="shrink-0 whitespace-nowrap text-right text-[13px] text-muted">
          <div>↑ {t(w.sunrise)}</div>
          <div>↓ {t(w.sunset)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {w.outside.good ? (
          <Pill tone="good">🌿 Good time to be outside</Pill>
        ) : (
          <Pill tone="muted">{w.outside.reasons.filter((r) => !["Dry", "Light wind", "Good visibility"].includes(r)).join(" · ") || "Not ideal outside"}</Pill>
        )}
        <Pill tone={w.drone.good ? "accent" : "muted"}>🛩️ {w.drone.good ? "Calm enough to fly" : `No flying: ${w.drone.reason.toLowerCase()}`}</Pill>
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto px-4 md:-mx-5 md:px-5">
        {w.hourly.slice(0, 10).map((h, i) => {
          const d = describe(h.code);
          return (
            <div key={h.time} className="flex min-w-[52px] flex-col items-center gap-1 rounded-xl py-1 text-[13px]">
              <span className="text-muted">{i === 0 ? "Now" : h.time.slice(11, 13)}</span>
              <span className="text-[20px]">{d.icon}</span>
              <span className="font-semibold tabular-nums">{Math.round(h.temp)}°</span>
              <span className={h.rainChance >= 40 ? "text-[#4aa8d8]" : "text-transparent"}>{h.rainChance}%</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-2 border-t border-line pt-3">
        {w.daily.slice(1, 5).map((d) => (
          <div key={d.date} className="flex flex-col items-center text-[13px]">
            <span className="font-medium text-muted">{formatWeekdayShort(d.date)}</span>
            <span className="text-[20px]">{describe(d.code).icon}</span>
            <span className="tabular-nums">
              {Math.round(d.max)}° <span className="text-muted">{Math.round(d.min)}°</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
