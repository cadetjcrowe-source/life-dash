"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { mutate } from "swr";
import type { Place, Settings } from "@/db/schema";
import { toast } from "@/components/Toast";
import { api, useSettings } from "./client";
import { DEFAULT_SETTINGS } from "./constants";
import { LOCATION_MAX_AGE_MS, LOCATION_MOVE_KM, distanceKm, resolveLocation, type ResolvedPlace } from "./location";

// ── Device location ────────────────────────────────────────
// Battery-friendly: we ask the device for a position at most every 30 minutes
// (on open / when the app comes back to the foreground), accept a cached fix up
// to 10 minutes old (a manual refresh always gets a fresh one), and only re-save + re-name it when you've moved > 3 km or
// the saved copy is more than 30 minutes old.

type Status = "idle" | "locating" | "ok" | "denied" | "unavailable" | "fixed";

type Ctx = {
  place: ResolvedPlace;
  status: Status;
  /** True when we haven't asked yet: show the polite explainer instead of the system prompt. */
  needsPrompt: boolean;
  refresh: (opts?: { force?: boolean }) => Promise<void>;
  allow: () => void;
  dismiss: () => void;
};

const LocationCtx = createContext<Ctx | null>(null);

const KEY_FIX = "life.location.fix"; // { lat, lon, at }
const KEY_ALLOWED = "life.location.allowed"; // "1" once you've said yes
const KEY_DISMISSED = "life.location.dismissed"; // timestamp of "Not now"
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

const store = {
  get<T>(k: string): T | null {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* private mode etc. – fine, we just ask again later */
    }
  },
};

/** Automatic checks accept a fix up to 10 minutes old; a manual refresh always gets a fresh one. */
function getPosition(fresh: boolean): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false, // Wi-Fi/cell is plenty for weather and saves battery
      timeout: 15_000,
      maximumAge: fresh ? 0 : 10 * 60 * 1000,
    }),
  );
}

/** Place name for coordinates. BigDataCloud's free client endpoint, then Nominatim. */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (r.ok) {
      const j = await r.json();
      const name = j.city || j.locality || j.principalSubdivision;
      if (name) return [name, j.countryName].filter(Boolean).join(", ");
    }
  } catch {
    /* try the next one */
  }
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`, {
      headers: { "Accept-Language": "en" },
    });
    if (r.ok) {
      const a = (await r.json()).address ?? {};
      const name = a.city || a.town || a.village || a.county || a.state;
      if (name) return [name, a.country].filter(Boolean).join(", ");
    }
  } catch {
    /* fall through */
  }
  return null;
}

export type CityResult = Place & { detail: string };

/** City search for the fixed location (Open-Meteo geocoding, no key). */
export async function searchCities(q: string): Promise<CityResult[]> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
  if (!r.ok) throw new Error("City search is unavailable right now");
  const j = await r.json();
  return (j.results ?? []).map((x: { name: string; latitude: number; longitude: number; admin1?: string; country?: string }) => ({
    lat: x.latitude,
    lon: x.longitude,
    name: [x.name, x.country].filter(Boolean).join(", "),
    detail: [x.admin1, x.country].filter(Boolean).join(", "),
  }));
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSettings();
  const settings: Settings = data ?? DEFAULT_SETTINGS;
  const place = resolveLocation(settings);
  const [status, setStatus] = useState<Status>("idle");
  const [needsPrompt, setNeedsPrompt] = useState(false);
  const busy = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const locate = useCallback(async (force: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setStatus("locating");
    try {
      const pos = await getPosition(force);
      const fix = { lat: pos.coords.latitude, lon: pos.coords.longitude, at: Date.now() };
      store.set(KEY_FIX, fix);
      store.set(KEY_ALLOWED, "1");
      setNeedsPrompt(false);

      const last = settingsRef.current.lastLocation;
      const moved = !last || distanceKm(last, fix) > LOCATION_MOVE_KM;
      const stale = !last || Date.now() - Date.parse(last.at) > LOCATION_MAX_AGE_MS;
      let name = last?.name ?? "";
      if (moved || stale || force) {
        // Only look the name up again when you've actually moved.
        name = (!moved && last?.name) || (await reverseGeocode(fix.lat, fix.lon)) || last?.name || `${fix.lat.toFixed(2)}°, ${fix.lon.toFixed(2)}°`;
        await api("/api/location", "POST", { lat: fix.lat, lon: fix.lon, name, accuracy: Math.round(pos.coords.accuracy) });
        await mutate("/api/settings");
        await mutate("/api/weather");
      }
      setStatus("ok");
      if (force) toast(`📍 Updated to ${name.split(",")[0] || "your location"}`);
    } catch (e) {
      const code = (e as GeolocationPositionError).code;
      setStatus(code === 1 ? "denied" : "unavailable");
      if (force) toast(code === 1 ? "Location is turned off for Life — using your last saved place" : "Couldn't get your location — using your last saved place");
    } finally {
      busy.current = false;
    }
  }, []);

  const check = useCallback(
    async (force = false) => {
      const s = settingsRef.current;
      if (s.locationMode === "fixed") {
        setStatus("fixed");
        if (force) await mutate("/api/weather");
        return;
      }
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) return setStatus("unavailable");

      const perm = await navigator.permissions?.query({ name: "geolocation" as PermissionName }).catch(() => null);
      if (perm?.state === "denied") {
        setStatus("denied");
        if (force) toast("Location is blocked for Life. Allow it in your device settings, or set a fixed location in Settings.");
        return;
      }
      const allowedBefore = store.get<string>(KEY_ALLOWED) === "1";
      if (!force && perm?.state !== "granted" && !allowedBefore) {
        // Not asked yet: show our short explanation first, never a surprise system prompt.
        const dismissed = store.get<number>(KEY_DISMISSED);
        setNeedsPrompt(!dismissed || Date.now() - dismissed > DISMISS_FOR_MS);
        return;
      }
      const fix = store.get<{ lat: number; lon: number; at: number }>(KEY_FIX);
      if (!force && fix && Date.now() - fix.at < LOCATION_MAX_AGE_MS && s.lastLocation) return setStatus("ok");
      await locate(force);
    },
    [locate],
  );

  // On open (once settings have loaded) and whenever the app returns to the foreground.
  const loaded = !!data;
  useEffect(() => {
    if (!loaded) return;
    check();
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loaded, settings.locationMode, check]);

  const value: Ctx = {
    place,
    status: settings.locationMode === "fixed" ? "fixed" : status,
    needsPrompt: settings.locationMode === "current" && needsPrompt,
    refresh: ({ force = true } = {}) => check(force),
    allow: () => {
      setNeedsPrompt(false);
      locate(true);
    },
    dismiss: () => {
      store.set(KEY_DISMISSED, Date.now());
      setNeedsPrompt(false);
    },
  };
  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
}

export function useLocation(): Ctx {
  const c = useContext(LocationCtx);
  if (!c) throw new Error("useLocation must be used inside LocationProvider");
  return c;
}
