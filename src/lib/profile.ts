/** Whose dashboard this is: shown on the login page and used as the default name. */
export const OWNER_NAME = "Jacob";

// Install-wide defaults. Everything else personal (your name, categories,
// location, timetable…) lives in the database and is edited in Settings.
//
// Optional environment variables for people outside the UK:
//   NEXT_PUBLIC_TIME_ZONE         e.g. "Europe/Dublin", "America/New_York" (default Europe/London)
//   NEXT_PUBLIC_DEFAULT_LOCATION  "lat,lon,Place name" used until the app knows where you are
//                                 (default "54.32,-4.38,Ramsey, Isle of Man")

function validTimeZone(tz: string | undefined): string | null {
  if (!tz) return null;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

export const TIME_ZONE = validTimeZone(process.env.NEXT_PUBLIC_TIME_ZONE) ?? "Europe/London";

function parsePlace(v: string | undefined) {
  const m = v?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(.+)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon, name: m[3].trim() } : null;
}

export const DEFAULT_LOCATION = parsePlace(process.env.NEXT_PUBLIC_DEFAULT_LOCATION) ?? { lat: 54.32, lon: -4.38, name: "Ramsey, Isle of Man" };
