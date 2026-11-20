// Shared (client + server) weather types and helpers.

export type Weather = {
  location: { name: string; lat: number; lon: number; source: "fixed" | "device" | "default" };
  current: {
    temp: number;
    feelsLike: number;
    code: number;
    wind: number; // km/h
    gusts: number; // km/h
    precipitation: number; // mm
    visibility: number; // metres
    isDay: boolean;
  };
  hourly: { time: string; temp: number; code: number; rainChance: number }[];
  daily: { date: string; code: number; max: number; min: number; rainChance: number }[];
  sunrise: string | null;
  sunset: string | null;
  outside: { good: boolean; reasons: string[] };
  drone: { good: boolean; reason: string };
  fetchedAt: string;
};

const CODES: Record<number, [string, string, string?]> = {
  0: ["Clear", "☀️", "🌙"],
  1: ["Mostly clear", "🌤️", "🌙"],
  2: ["Partly cloudy", "⛅", "☁️"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Freezing fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Showers", "🌦️"],
  81: ["Showers", "🌧️"],
  82: ["Heavy showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm, hail", "⛈️"],
  99: ["Thunderstorm, hail", "⛈️"],
};

export function describe(code: number, isDay = true): { label: string; icon: string } {
  const [label, day, night] = CODES[code] ?? ["—", "🌡️"];
  return { label, icon: !isDay && night ? night : day };
}

// Thresholds for "good to be outside" and "calm enough to fly a drone".
export const OUTSIDE = { maxRainChance: 30, maxWind: 20, minVisibility: 10_000 };
export const DRONE = { maxWind: 25, maxGusts: 35 };

export function assessOutside(
  c: Weather["current"],
  nextHoursRainChance: number,
): Weather["outside"] {
  const reasons: string[] = [];
  const dry = c.precipitation === 0 && nextHoursRainChance <= OUTSIDE.maxRainChance && !(c.code >= 51);
  const calm = c.wind < OUTSIDE.maxWind;
  const clear = c.visibility >= OUTSIDE.minVisibility;
  reasons.push(dry ? "Dry" : "Wet");
  reasons.push(calm ? "Light wind" : "Windy");
  reasons.push(clear ? "Good visibility" : "Poor visibility");
  return { good: dry && calm && clear, reasons };
}

export function assessDrone(c: Weather["current"], dry: boolean): Weather["drone"] {
  if (!dry) return { good: false, reason: "Rain about" };
  if (c.gusts >= DRONE.maxGusts) return { good: false, reason: `Gusts ${Math.round(c.gusts)} km/h` };
  if (c.wind >= DRONE.maxWind) return { good: false, reason: `Wind ${Math.round(c.wind)} km/h` };
  if (c.visibility < 5000) return { good: false, reason: "Low visibility" };
  return { good: true, reason: `Wind ${Math.round(c.wind)}, gusts ${Math.round(c.gusts)} km/h` };
}
