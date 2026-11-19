import { bad, ok } from "@/lib/http";
import { getWeather } from "@/lib/weather-server";

export const dynamic = "force-dynamic"; // upstream fetch is cached 15 min

export async function GET() {
  const weather = await getWeather();
  return weather ? ok(weather, { headers: { "Cache-Control": "private, max-age=300" } }) : bad("Weather unavailable", 502);
}
