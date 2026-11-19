"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";
import type { CalEvent, HabitEntry, InboxItem, JournalEntry, KitItem, KitList, Project, Settings, ShotIdea, Task, WeeklyReview } from "@/db/schema";
import type { Weather } from "./weather";
import { toast } from "@/components/Toast";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/login")) {
    window.location.href = "/login";
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || `Request failed (${res.status})`);
  return data as T;
}

export const fetcher = (url: string) => api(url);

/** Cross-device sync: revalidate on focus/reconnect and poll while the app is visible. */
export const swrConfig: SWRConfiguration = {
  fetcher,
  refreshInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 1500,
  focusThrottleInterval: 1000,
  keepPreviousData: true,
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16),
      );

/**
 * Optimistic update: apply `update` to the cached data immediately, run the
 * request, then revalidate. Rolls back (and shows a toast) on failure.
 */
export async function optimistic<T>(key: string, update: (cur: T) => T, request: () => Promise<unknown>) {
  try {
    await globalMutate<T>(
      key,
      async (cur) => {
        await request();
        return update(cur as T);
      },
      { optimisticData: (cur) => update(cur as T), rollbackOnError: true, populateCache: true, revalidate: true },
    );
  } catch (e) {
    toast(e instanceof Error ? e.message : "Couldn't save — try again");
  }
}

/** Revalidate any cached key that starts with prefix. */
export const refresh = (prefix: string) =>
  globalMutate((k) => typeof k === "string" && k.startsWith(prefix), undefined, { revalidate: true });

// ── Typed hooks ────────────────────────────────────────────
export const useTasks = () => useSWR<Task[]>("/api/tasks");
export const useInbox = () => useSWR<InboxItem[]>("/api/inbox");
export const useEvents = () => useSWR<CalEvent[]>("/api/events");
export const useProjects = () => useSWR<Project[]>("/api/projects");
export const useSettings = () => useSWR<Settings>("/api/settings");
export const useHabits = (from: string, to: string) => useSWR<HabitEntry[]>(`/api/habits?from=${from}&to=${to}`);
export const useJournalList = (q: string) => useSWR<JournalEntry[]>(`/api/journal?q=${encodeURIComponent(q)}`);
export const useJournalEntry = (date: string) => useSWR<JournalEntry | null>(`/api/journal/${date}`);
export const useShots = () => useSWR<ShotIdea[]>("/api/shots");
export type KitData = { lists: KitList[]; items: KitItem[] };
export const useKit = () => useSWR<KitData>("/api/kit");
export const usePixels = (year: number) => useSWR<import("./pixels").PixelYear>(`/api/pixels?year=${year}`, { refreshInterval: 60_000 });
export const useReviews = () => useSWR<WeeklyReview[]>("/api/reviews");
export const useWeather = () =>
  useSWR<Weather>("/api/weather", { refreshInterval: 15 * 60_000, revalidateOnFocus: false });

export type ReviewPayload = {
  weekStart: string;
  saved: WeeklyReview | null;
  live: WeeklyReview["summary"];
};
export const useReview = (week: string) => useSWR<ReviewPayload>(`/api/reviews/${week}`, { refreshInterval: 0 });
