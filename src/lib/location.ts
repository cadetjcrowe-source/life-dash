// Which place the weather and sun times are for. Shared by server and client.
import type { Place, Settings } from "@/db/schema";
import { DEFAULT_LOCATION } from "./profile";

export type LocationSource = "fixed" | "device" | "default";
export type ResolvedPlace = Place & { source: LocationSource; at?: string };

export const DEFAULT_PLACE: Place = DEFAULT_LOCATION;

/** How long a location stays fresh, and how far you must move before it's re-saved. */
export const LOCATION_MAX_AGE_MS = 30 * 60 * 1000;
export const LOCATION_MOVE_KM = 3;

/**
 * Fixed mode uses the chosen city. Otherwise the last device location the app
 * saved, falling back to the default place (Ramsey, Isle of Man unless configured).
 */
export function resolveLocation(s: Pick<Settings, "locationMode" | "fixedLocation" | "lastLocation">): ResolvedPlace {
  if (s.locationMode === "fixed" && s.fixedLocation) return { ...s.fixedLocation, source: "fixed" };
  if (s.lastLocation) return { lat: s.lastLocation.lat, lon: s.lastLocation.lon, name: s.lastLocation.name, source: "device", at: s.lastLocation.at };
  return { ...DEFAULT_PLACE, source: "default" };
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Short label like "Douglas" from "Douglas, Isle of Man". */
export const shortName = (name: string) => name.split(",")[0].trim() || name;
