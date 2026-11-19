"use client";

// All client-side mutations, each applied optimistically to the SWR cache.
import { mutate } from "swr";
import type { CalEvent, Category, HabitEntry, InboxItem, JournalEntry, KitItem, KitList, Project, Settings, ShotIdea, Task } from "@/db/schema";
import { api, optimistic, refresh, uid } from "./client";
import { addDays, today } from "./dates";

const now = () => new Date();

// ── Tasks ──────────────────────────────────────────────────
export type TaskDraft = Pick<Task, "title"> & Partial<Pick<Task, "notes" | "dueDate" | "priority" | "category" | "pinned" | "isAssignment">>;

function localTask(d: TaskDraft, id: string): Task {
  return {
    id,
    title: d.title,
    notes: d.notes ?? "",
    dueDate: d.dueDate ?? null,
    priority: d.priority ?? 2,
    category: d.category ?? "Personal",
    pinned: d.pinned ?? false,
    isAssignment: d.isAssignment ?? false,
    done: false,
    completedOn: null,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function addTask(d: TaskDraft) {
  const id = uid();
  return optimistic<Task[]>("/api/tasks", (l = []) => [localTask(d, id), ...l], () => api("/api/tasks", "POST", { ...d, id }));
}

export function updateTask(id: string, patch: Partial<TaskDraft> & { done?: boolean }) {
  const extra = patch.done === undefined ? {} : { completedOn: patch.done ? today() : null };
  return optimistic<Task[]>(
    "/api/tasks",
    (l = []) => l.map((t) => (t.id === id ? { ...t, ...patch, ...extra } : t)),
    () => api(`/api/tasks/${id}`, "PATCH", patch),
  );
}

export function deleteTask(id: string) {
  return optimistic<Task[]>("/api/tasks", (l = []) => l.filter((t) => t.id !== id), () => api(`/api/tasks/${id}`, "DELETE"));
}

// ── Inbox ──────────────────────────────────────────────────
export function addInbox(text: string) {
  const id = uid();
  return optimistic<InboxItem[]>(
    "/api/inbox",
    (l = []) => [{ id, text, createdAt: now(), updatedAt: now() }, ...l],
    () => api("/api/inbox", "POST", { id, text }),
  );
}

export function deleteInbox(id: string) {
  return optimistic<InboxItem[]>("/api/inbox", (l = []) => l.filter((i) => i.id !== id), () => api(`/api/inbox/${id}`, "DELETE"));
}

export async function inboxToTask(item: InboxItem, d: Partial<TaskDraft> = {}) {
  const id = uid();
  const draft = { title: item.text, ...d };
  mutate<Task[]>("/api/tasks", (l = []) => [localTask(draft, id), ...l], { revalidate: false });
  await optimistic<InboxItem[]>(
    "/api/inbox",
    (l = []) => l.filter((i) => i.id !== item.id),
    () => api(`/api/inbox/${item.id}`, "POST", { ...draft, id }),
  );
  refresh("/api/tasks");
}

// ── Events ─────────────────────────────────────────────────
export type EventDraft = Omit<CalEvent, "id" | "createdAt" | "updatedAt">;

export function addEvent(d: EventDraft) {
  const id = uid();
  return optimistic<CalEvent[]>(
    "/api/events",
    (l = []) => [...l, { ...d, id, createdAt: now(), updatedAt: now() }],
    () => api("/api/events", "POST", { ...d, id }),
  );
}

export function updateEvent(id: string, patch: Partial<EventDraft>) {
  return optimistic<CalEvent[]>(
    "/api/events",
    (l = []) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    () => api(`/api/events/${id}`, "PATCH", patch),
  );
}

export function deleteEvent(id: string) {
  return optimistic<CalEvent[]>("/api/events", (l = []) => l.filter((e) => e.id !== id), () => api(`/api/events/${id}`, "DELETE"));
}

export function skipOccurrence(ev: CalEvent, date: string) {
  return updateEvent(ev.id, { excludedDates: [...(ev.excludedDates ?? []), date] });
}

// ── Habits ─────────────────────────────────────────────────
// Every habit view shares one cache key covering the last ~3 months.
export const HABIT_DAYS = 92;
export const habitsKey = (t: string) => `/api/habits?from=${addDays(t, -HABIT_DAYS)}&to=${t}`;

type HabitDraft = Pick<HabitEntry, "date" | "kind" | "value"> & Partial<Pick<HabitEntry, "subtype" | "note">>;

export function logHabit(d: HabitDraft) {
  const key = habitsKey(today());
  const id = uid();
  const single = d.kind === "sleep" || d.kind === "water";
  return optimistic<HabitEntry[]>(
    key,
    (l = []) => {
      const existing = single ? l.find((e) => e.date === d.date && e.kind === d.kind) : undefined;
      if (existing) return l.map((e) => (e === existing ? { ...e, value: d.value } : e));
      return [...l, { id, subtype: null, note: "", ...d, createdAt: now(), updatedAt: now() }];
    },
    () => api("/api/habits", "POST", { ...d, id }),
  );
}

export function deleteHabit(id: string) {
  const key = habitsKey(today());
  return optimistic<HabitEntry[]>(key, (l = []) => l.filter((e) => e.id !== id), () => api(`/api/habits/${id}`, "DELETE"));
}

// ── Projects ───────────────────────────────────────────────
export type ProjectDraft = Partial<Omit<Project, "id" | "createdAt" | "updatedAt" | "sortOrder">> & { name?: string };

export function addProject(d: ProjectDraft & { name: string }) {
  const id = uid();
  return optimistic<Project[]>(
    "/api/projects",
    (l = []) => [
      ...l,
      {
        id,
        emoji: "📁",
        category: "Personal",
        status: "active",
        progress: 0,
        nextAction: "",
        notes: "",
        archived: false,
        sortOrder: l.length + 1,
        createdAt: now(),
        updatedAt: now(),
        ...d,
      } as Project,
    ],
    () => api("/api/projects", "POST", { ...d, id }),
  );
}

export function updateProject(id: string, patch: ProjectDraft) {
  return optimistic<Project[]>(
    "/api/projects",
    (l = []) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    () => api(`/api/projects/${id}`, "PATCH", patch),
  );
}

export function deleteProject(id: string) {
  return optimistic<Project[]>("/api/projects", (l = []) => l.filter((p) => p.id !== id), () => api(`/api/projects/${id}`, "DELETE"));
}

export function reorderProjects(ids: string[]) {
  return optimistic<Project[]>(
    "/api/projects",
    (l = []) => l.map((p) => ({ ...p, sortOrder: ids.indexOf(p.id) === -1 ? 9999 : ids.indexOf(p.id) })).sort((a, b) => a.sortOrder - b.sortOrder),
    () => api("/api/projects/reorder", "POST", { ids }),
  );
}

// ── Journal ────────────────────────────────────────────────
export async function saveJournal(date: string, patch: { mood?: number | null; body?: string }) {
  await optimistic<JournalEntry | null>(
    `/api/journal/${date}`,
    (cur) => ({ date, mood: null, body: "", createdAt: now(), ...(cur ?? {}), ...patch, updatedAt: now() }),
    () => api(`/api/journal/${date}`, "PUT", patch),
  );
  refresh("/api/journal?");
}

// ── Settings ───────────────────────────────────────────────
export type SettingsPatch = Omit<Partial<Settings>, "features"> & { features?: Partial<Settings["features"]> };

export function saveSettings(patch: SettingsPatch) {
  return optimistic<Settings>(
    "/api/settings",
    (s) => ({ ...s, ...patch, features: { ...s.features, ...(patch.features ?? {}) } }),
    () => api("/api/settings", "PUT", patch),
  );
}

// ── Shot ideas ─────────────────────────────────────────────
export type ShotDraft = Pick<ShotIdea, "title"> &
  Partial<Pick<ShotIdea, "description" | "location" | "bestTime" | "link" | "imageUrl" | "tags">>;

export function addShot(d: ShotDraft) {
  const id = uid();
  const row: ShotIdea = {
    id,
    description: "",
    location: "",
    bestTime: "any",
    link: "",
    imageUrl: "",
    tags: [],
    shot: false,
    shotOn: null,
    createdAt: now(),
    updatedAt: now(),
    ...d,
  };
  return optimistic<ShotIdea[]>("/api/shots", (l = []) => [row, ...l], () => api("/api/shots", "POST", { ...d, id }));
}

export function updateShot(id: string, patch: Partial<ShotDraft> & { shot?: boolean }) {
  const extra = patch.shot === undefined ? {} : { shotOn: patch.shot ? today() : null };
  return optimistic<ShotIdea[]>(
    "/api/shots",
    (l = []) => l.map((s) => (s.id === id ? { ...s, ...patch, ...extra } : s)),
    () => api(`/api/shots/${id}`, "PATCH", patch),
  );
}

export function deleteShot(id: string) {
  return optimistic<ShotIdea[]>("/api/shots", (l = []) => l.filter((s) => s.id !== id), () => api(`/api/shots/${id}`, "DELETE"));
}

// ── Kit lists ──────────────────────────────────────────────
type Kit = { lists: KitList[]; items: KitItem[] };
const KIT = "/api/kit";

export function addKitList(name: string, emoji = "🎒") {
  const id = uid();
  return optimistic<Kit>(
    KIT,
    (k = { lists: [], items: [] }) => ({ ...k, lists: [...k.lists, { id, name, emoji, sortOrder: k.lists.length, createdAt: now() }] }),
    () => api("/api/kit/lists", "POST", { id, name, emoji }),
  );
}

export function updateKitList(id: string, patch: { name?: string; emoji?: string }) {
  return optimistic<Kit>(KIT, (k) => ({ ...k, lists: k.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) }), () => api(`/api/kit/lists/${id}`, "PATCH", patch));
}

export function deleteKitList(id: string) {
  return optimistic<Kit>(
    KIT,
    (k) => ({ lists: k.lists.filter((l) => l.id !== id), items: k.items.filter((i) => i.listId !== id) }),
    () => api(`/api/kit/lists/${id}`, "DELETE"),
  );
}

/** One-tap reset: untick everything in a list. */
export function resetKitList(id: string) {
  return optimistic<Kit>(
    KIT,
    (k) => ({ ...k, items: k.items.map((i) => (i.listId === id ? { ...i, checked: false } : i)) }),
    () => api(`/api/kit/lists/${id}`, "POST", { action: "reset" }),
  );
}

export function addKitItem(listId: string, text: string) {
  const id = uid();
  return optimistic<Kit>(
    KIT,
    (k) => ({ ...k, items: [...k.items, { id, listId, text, checked: false, sortOrder: k.items.filter((i) => i.listId === listId).length, createdAt: now() }] }),
    () => api("/api/kit/items", "POST", { id, listId, text }),
  );
}

export function updateKitItem(id: string, patch: { text?: string; checked?: boolean }) {
  return optimistic<Kit>(KIT, (k) => ({ ...k, items: k.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }), () => api(`/api/kit/items/${id}`, "PATCH", patch));
}

export function deleteKitItem(id: string) {
  return optimistic<Kit>(KIT, (k) => ({ ...k, items: k.items.filter((i) => i.id !== id) }), () => api(`/api/kit/items/${id}`, "DELETE"));
}

// ── Categories ─────────────────────────────────────────────
const CATS = "/api/categories";

export function addCategory(name: string, color: string) {
  const id = uid();
  return optimistic<Category[]>(
    CATS,
    (l = []) => [...l, { id, name, color, sortOrder: l.length, createdAt: now() }],
    () => api(CATS, "POST", { id, name, color }),
  );
}

/** Renaming also updates every task, event and project in that category. */
export async function updateCategory(id: string, patch: { name?: string; color?: string }) {
  await optimistic<Category[]>(CATS, (l = []) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)), () => api(`${CATS}/${id}`, "PATCH", patch));
  if (patch.name) ["/api/tasks", "/api/events", "/api/projects"].forEach(refresh);
}

export async function deleteCategory(id: string) {
  await optimistic<Category[]>(CATS, (l = []) => l.filter((c) => c.id !== id), () => api(`${CATS}/${id}`, "DELETE"));
  ["/api/tasks", "/api/events", "/api/projects"].forEach(refresh);
}

export function reorderCategories(ids: string[]) {
  return optimistic<Category[]>(
    CATS,
    (l = []) => ids.map((id, i) => ({ ...l.find((c) => c.id === id)!, sortOrder: i })).filter((c) => c.id),
    () => api(`${CATS}/reorder`, "POST", { ids }),
  );
}
