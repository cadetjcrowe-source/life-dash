"use client";

import { useWeather } from "@/lib/client";
import { formatWeekdayShort } from "@/lib/dates";
import { useLocation } from "@/lib/location-client";
import { shortName } from "@/lib/location";
import { describe } from "@/lib/weather";
import { IconMapPin } from "./Icons";
import { Button, Card, Pill, Skeleton, cx } from "./ui";

/** Place name + pin. Tap to refresh your location (or the weather, in fixed mode). */
function PlaceButton({ name }: { name: string }) {
  const { status, refresh, place } = useLocation();
  const locating = status === "locating";
  const label =
    place.source === "fixed" ? "Fixed location" : status === "denied" ? "Location off · last saved" : place.source === "default" ? "Default location" : "Your location";
  return (
    <button
      onClick={() => refresh()}
      disabled={locating}
      className="press -ml-1.5 flex min-h-11 items-center gap-1 rounded-full pl-1.5 pr-2.5 text-left"
      aria-label={`${name}. ${label}. Tap to refresh location`}
      title="Refresh location"
    >
      <IconMapPin
        size={17}
        className={cx("shrink-0", place.source === "device" && status !== "denied" ? "text-accent" : "text-muted", locating && "animate-pulse")}
        fill={place.source === "device" && status !== "denied" ? "currentColor" : "none"}
        fillOpacity={0.18}
      />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold">{locating ? "Locating…" : shortName(name)}</span>
        <span className="block text-[12px] leading-tight text-muted">{label}</span>
      </span>
    </button>
  );
}

/** Polite explainer shown before the system permission prompt. */
function LocationAsk() {
  const { needsPrompt, allow, dismiss } = useLocation();
  if (!needsPrompt) return null;
  return (
    <div className="anim-rise mb-3 rounded-2xl bg-accent-soft p-3.5">
      <p className="text-[15px] font-semibold">📍 Weather for where you are?</p>
      <p className="mt-0.5 text-[14px] text-muted">
        Life can use your location for local weather and golden hour times. It's only saved to your own dashboard, and you can switch to a fixed place in Settings.
      </p>
      <div className="mt-2.5 flex gap-2">
        <Button size="sm" onClick={allow}>
          Use my location
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}

export function WeatherCard({ delay }: { delay?: number }) {
  const { data: w, error } = useWeather();
  if (error)
    return (
      <Card delay={delay}>
        <LocationAsk />
        <p className="text-muted">Weather unavailable right now.</p>
      </Card>
    );
  if (!w)
    return (
      <Card delay={delay}>
        <LocationAsk />
        <Skeleton className="h-28" />
      </Card>
    );
  const now = describe(w.current.code, w.current.isDay);
  const t = (time: string | null) => time?.slice(11, 16) ?? "–";
  return (
    <Card delay={delay}>
      <LocationAsk />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <PlaceButton name={w.location.name} />
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
