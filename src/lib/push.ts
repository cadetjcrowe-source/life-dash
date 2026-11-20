import "server-only";
import { eq } from "drizzle-orm";
import * as webpush from "web-push";
import { db, schema } from "@/db";
import { today as londonToday } from "./dates";
import { getLocation, getSettings } from "./settings";
import { shortName } from "./location";
import { fmtTime, goldenStatus, sunDay } from "./sun";
import { topThree } from "./tasks";
import { lessonsOn, subjectOf } from "./timetable";
import { describe } from "./weather";
import { getWeather } from "./weather-server";
import { vapidKeys } from "./vapid";

export const pushConfigured = () => vapidKeys().ok;

function setup() {
  const site = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  // Apple's push service needs a real mailto: or https: subject.
  const subject = process.env.VAPID_SUBJECT || (site ? `https://${site}` : "mailto:life-dashboard@example.org");
  const keys = vapidKeys();
  if (!keys.ok) throw new Error(`Push keys problem: ${keys.problem}`);
  webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Send to every saved device. Subscriptions the browser has dropped are deleted. */
export async function sendToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!pushConfigured()) throw new Error("Push isn't set up (missing VAPID keys)");
  setup();
  const subs = await db().select().from(schema.pushSubscriptions);
  let sent = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
          TTL: 4 * 60 * 60,
          urgency: "normal",
        });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db().delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
          removed++;
        } else console.error("push failed", code, err);
      }
    }),
  );
  return { sent, removed };
}

/** "Good morning" summary: weather, golden hour and top 3 tasks. */
export async function buildMorningSummary(): Promise<PushPayload> {
  const t = londonToday();
  const place = await getLocation();
  const [weather, tasks, settings, events] = await Promise.all([getWeather(place), db().select().from(schema.tasks).where(eq(schema.tasks.done, false)), getSettings(), db().select().from(schema.events)]);

  const lines: string[] = [];
  if (weather) {
    const d = describe(weather.current.code, weather.current.isDay);
    const today = weather.daily[0];
    lines.push(`${d.icon} ${Math.round(weather.current.temp)}° in ${shortName(place.name)}, ${d.label.toLowerCase()}${today ? `, high ${Math.round(today.max)}°` : ""}${weather.outside.good ? " · good to be outside" : ""}`);
  }
  if (settings.features.timetable) {
    const lessons = lessonsOn(events, t).filter((l) => l.startTime);
    lines.push(
      lessons.length
        ? `🎓 ${lessons.map((l) => `${l.startTime} ${l.location}${subjectOf(l) !== "Lesson" ? ` ${subjectOf(l)}` : ""}`).join(" · ")}`
        : "🎓 No lessons today",
    );
  }
  if (settings.features.golden) {
    const day = sunDay(t, place);
    const evening = day.windows.find((w) => w.kind === "evening");
    const g = goldenStatus(t, new Date(), place);
    if (evening) lines.push(`🌇 Golden hour ${fmtTime(evening.start)}–${fmtTime(evening.end)} · sunset ${fmtTime(day.sunset)}`);
    else if (g.state === "next") lines.push(`🌅 Next golden hour ${fmtTime(g.window.start)}`);
  }
  const top = topThree(tasks, t);
  lines.push(top.length ? `✅ ${top.map((x, i) => `${i + 1}. ${x.title}`).join("  ")}` : "✅ No tasks lined up. Enjoy the day!");

  return { title: `Good morning${settings.ownerName ? `, ${settings.ownerName}` : ""} ☀️`, body: lines.join("\n"), url: "/", tag: `morning-${t}` };
}
