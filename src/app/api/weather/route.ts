import { bad, ok } from "@/lib/http";
import { getLocation } from "@/lib/settings";
import { getWeather } from "@/lib/weather-server";

export const dynamic = "force-dynamic"; // upstream fetch is cached 15 min

// Weather for your saved location (fixed city → last device location → Ramsey).
export async function GET() {
  const weather = await getWeather(await getLocation());
  return weather ? ok(weather, { headers: { "Cache-Control": "private, no-cache" } }) : bad("Weather unavailable", 502);
}
