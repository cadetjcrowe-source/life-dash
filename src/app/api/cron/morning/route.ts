import { timingSafeEqual } from "node:crypto";
import { addDays, nowTime, today } from "@/lib/dates";
import { bad, handle, ok } from "@/lib/http";
import { buildMorningSummary, pushConfigured, sendToAll } from "@/lib/push";
import { getSettings, saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Morning summary trigger. Two callers:
 *  - Vercel Cron (once a day, see vercel.json) – works on the free Hobby plan.
 *  - ?mode=precise – a 15-minute pinger (GitHub Actions workflow) so the
 *    notification arrives at the exact time chosen in Settings.
 * Either way it sends at most once per day.
 */
export const GET = handle(async (req: Request) => {
  const secret = process.env.CRON_SECRET ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) {
    return bad("Unauthorised", 401);
  }
  if (!pushConfigured()) return ok({ skipped: "push not configured" });

  const precise = new URL(req.url).searchParams.get("mode") === "precise";
  const s = await getSettings();
  const t = today();
  if (precise) await saveSettings({ pushPrecisePingAt: new Date().toISOString() });

  if (!s.features.morningPush || !s.pushEnabled) return ok({ skipped: "turned off in Settings" });
  if (s.pushLastSent === t) return ok({ skipped: "already sent today" });

  if (precise) {
    // Send once the chosen time has passed (with a 3-hour window, so a late ping never sends in the evening).
    const now = nowTime();
    const [h, m] = s.pushTime.split(":").map(Number);
    const end = `${String(Math.min(23, h + 3)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    if (now < s.pushTime || now > end) return ok({ skipped: `waiting for ${s.pushTime}` });
  } else if (s.pushPrecisePingAt && s.pushPrecisePingAt.slice(0, 10) >= addDays(t, -1)) {
    // The precise pinger is active, so let it deliver at the exact time.
    return ok({ skipped: "precise pinger active" });
  }

  const result = await sendToAll(await buildMorningSummary());
  // Only count the day as done if a device actually received it, so a
  // temporary failure gets retried on the next ping.
  if (result.sent > 0) await saveSettings({ pushLastSent: t });
  return ok({ sent: result.sent, removed: result.removed });
});
