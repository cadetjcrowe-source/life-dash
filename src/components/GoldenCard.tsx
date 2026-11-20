"use client";

import { useEffect, useState } from "react";
import { addDays } from "@/lib/dates";
import { fmtDuration, fmtTime, goldenStatus, sunDay } from "@/lib/sun";
import { useToday } from "@/lib/useToday";
import { useLocation } from "@/lib/location-client";
import { shortName } from "@/lib/location";
import { IconSun } from "./Icons";
import { Card, CardTitle, Skeleton, cx } from "./ui";

/** Sunrise, sunset and golden hours for your location, with a live countdown. */
export function GoldenCard() {
  const today = useToday();
  const { place } = useLocation();
  // Clock-based, so it renders only in the browser (avoids server/client mismatch).
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);
  if (!now)
    return (
      <Card>
        <CardTitle icon={<IconSun size={18} />}>Golden hour</CardTitle>
        <Skeleton className="h-44" />
      </Card>
    );

  const day = sunDay(today, place);
  const status = goldenStatus(today, now, place);
  const morning = day.windows.find((w) => w.kind === "morning");
  const evening = day.windows.find((w) => w.kind === "evening");
  const tomorrowStarts = sunDay(addDays(today, 1), place).windows.map((w) => w.start.getTime());
  const isTomorrow = status.state !== "none" && tomorrowStarts.includes(status.window.start.getTime());

  return (
    <Card>
      <CardTitle icon={<IconSun size={18} />} action={<span className="truncate text-[14px] text-muted">📍 {shortName(place.name)}</span>}>
        Golden hour
      </CardTitle>
      <div
        className={cx(
          "rounded-2xl p-4",
          status.state === "now" ? "bg-gradient-to-br from-[#f6c46a] to-[#ee8f5a] text-[#3b2208]" : "bg-[color-mix(in_srgb,#f0a640_14%,transparent)]",
        )}
      >
        {status.state === "now" ? (
          <>
            <p className="text-[15px] font-semibold">✨ Golden hour is happening now</p>
            <p className="text-[34px] font-semibold leading-tight tabular-nums">{fmtDuration(status.msLeft)} left</p>
            <p className="text-[14px] opacity-80">Ends at {fmtTime(status.window.end)} — grab the camera!</p>
          </>
        ) : status.state === "next" ? (
          <>
            <p className="text-[15px] font-medium text-muted">
              Next: {isTomorrow ? "tomorrow's " : ""}
              {status.window.kind} golden hour
            </p>
            <p className="text-[34px] font-semibold leading-tight tabular-nums">in {fmtDuration(status.msUntil)}</p>
            <p className="text-[14px] text-muted">
              {fmtTime(status.window.start)} – {fmtTime(status.window.end)}
            </p>
          </>
        ) : (
          <p className="text-muted">No golden hour today.</p>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
        <div className="rounded-xl bg-card-2 p-3">
          <p className="text-muted">🌅 Sunrise</p>
          <p className="text-[19px] font-semibold tabular-nums">{fmtTime(day.sunrise)}</p>
          {morning && <p className="text-[13px] text-muted">Golden until {fmtTime(morning.end)}</p>}
        </div>
        <div className="rounded-xl bg-card-2 p-3">
          <p className="text-muted">🌇 Sunset</p>
          <p className="text-[19px] font-semibold tabular-nums">{fmtTime(day.sunset)}</p>
          {evening && <p className="text-[13px] text-muted">Golden from {fmtTime(evening.start)}</p>}
        </div>
      </div>
    </Card>
  );
}
