import "server-only";
import type { ResolvedPlace } from "./location";
import { TZ } from "./dates";
import { assessDrone, assessOutside, type Weather } from "./weather";

type OM = {
  current: Record<string, number>;
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[] };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
};

/**
 * Fetch + interpret the Open-Meteo forecast for a place (cached for 15 minutes).
 * Coordinates are rounded to ~1 km so nearby requests share the cache.
 */
export async function getWeather(place: ResolvedPlace): Promise<Weather | null> {
  const params = new URLSearchParams({
    latitude: place.lat.toFixed(2),
    longitude: place.lon.toFixed(2),
    timezone: TZ,
    wind_speed_unit: "kmh",
    forecast_days: "5",
    current:
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,visibility,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const om = (await res.json()) as OM;

    const current: Weather["current"] = {
      temp: om.current.temperature_2m,
      feelsLike: om.current.apparent_temperature,
      code: om.current.weather_code,
      wind: om.current.wind_speed_10m,
      gusts: om.current.wind_gusts_10m,
      precipitation: om.current.precipitation,
      visibility: om.current.visibility ?? 20_000,
      isDay: om.current.is_day === 1,
    };

    // Hourly forecast from the current hour onward (times are London local, "YYYY-MM-DDTHH:MM").
    const nowKey = (om.current.time as unknown as string)?.slice(0, 13) ?? "";
    let start = om.hourly.time.findIndex((t) => t.slice(0, 13) >= nowKey);
    if (start < 0) start = 0;
    const hourly = om.hourly.time.slice(start, start + 12).map((time, i) => ({
      time,
      temp: om.hourly.temperature_2m[start + i],
      code: om.hourly.weather_code[start + i],
      rainChance: om.hourly.precipitation_probability[start + i] ?? 0,
    }));
    const next3Rain = Math.max(0, ...hourly.slice(0, 3).map((h) => h.rainChance));
    const outside = assessOutside(current, next3Rain);

    const weather: Weather = {
      location: { name: place.name, lat: place.lat, lon: place.lon, source: place.source },
      current,
      hourly,
      daily: om.daily.time.map((date, i) => ({
        date,
        code: om.daily.weather_code[i],
        max: om.daily.temperature_2m_max[i],
        min: om.daily.temperature_2m_min[i],
        rainChance: om.daily.precipitation_probability_max[i] ?? 0,
      })),
      sunrise: om.daily.sunrise[0] ?? null,
      sunset: om.daily.sunset[0] ?? null,
      outside,
      drone: assessDrone(current, outside.reasons[0] === "Dry"),
      fetchedAt: new Date().toISOString(),
    };
    return weather;
  } catch (e) {
    console.error(e);
    return null;
  }
}
