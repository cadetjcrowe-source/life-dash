"use client";

import { createContext, useContext } from "react";
import useSWR from "swr";
import type { Category } from "@/db/schema";
import { DEFAULT_CATEGORIES } from "./constants";

// Live category colours. AppShell keeps this in sync with the database, so
// `categoryColor(name)` works anywhere (including outside React render paths).
let colors: Record<string, string> = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.name, c.color]));
const FALLBACK = "#9A9AA3";

export function categoryColor(name: string): { dot: string; soft: string } {
  const dot = colors[name] ?? FALLBACK;
  return { dot, soft: `color-mix(in srgb, ${dot} 17%, transparent)` };
}

const fallbackList = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: c.name, sortOrder: i, createdAt: new Date(0) })) as Category[];
const Ctx = createContext<Category[]>(fallbackList);

export function useCategoriesQuery() {
  return useSWR<Category[]>("/api/categories");
}

/** Wraps the app: loads categories and publishes them to context + the colour map. */
export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { data } = useCategoriesQuery();
  const list = data && data.length ? data : fallbackList;
  colors = Object.fromEntries(list.map((c) => [c.name, c.color]));
  return <Ctx.Provider value={list}>{children}</Ctx.Provider>;
}

export const useCategories = () => useContext(Ctx);
export const useCategoryNames = () => useCategories().map((c) => c.name);
