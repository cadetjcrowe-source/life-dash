import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  date,
  uuid,
  index,
} from "drizzle-orm/pg-core";

// Dates that represent a calendar day in your time zone are stored as
// `date` columns in "YYYY-MM-DD" string mode, so no timezone shifting ever happens.

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    dueDate: date("due_date", { mode: "string" }),
    priority: integer("priority").notNull().default(2), // 1 = low, 2 = medium, 3 = high
    category: text("category").notNull().default("Personal"),
    done: boolean("done").notNull().default(false),
    completedOn: date("completed_on", { mode: "string" }),
    pinned: boolean("pinned").notNull().default(false),
    isAssignment: boolean("is_assignment").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_due_idx").on(t.dueDate), index("tasks_completed_idx").on(t.completedOn)],
);

export const inboxItems = pgTable("inbox_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  date: date("date", { mode: "string" }).notNull(), // first occurrence
  startTime: text("start_time"), // "HH:MM" (null = all day)
  endTime: text("end_time"),
  location: text("location").notNull().default(""),
  category: text("category").notNull().default("Personal"),
  repeat: text("repeat").notNull().default("none"), // none | daily | weekly | fortnightly | monthly
  repeatUntil: date("repeat_until", { mode: "string" }),
  excludedDates: jsonb("excluded_dates").$type<string[]>().notNull().default([]),
  // "lesson" = part of the college timetable (title = subject, location = room).
  kind: text("kind").notNull().default("event"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One table for every habit log. kind:
//   sleep    – value = hours (one per day)
//   water    – value = glasses (one per day)
//   creative – value = minutes, subtype = music | editing | photography (many per day)
//   gym      – value = minutes (optional), many per day
export const habitEntries = pgTable(
  "habit_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date", { mode: "string" }).notNull(),
    kind: text("kind").notNull(),
    value: real("value").notNull().default(0),
    subtype: text("subtype"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("habit_date_idx").on(t.date, t.kind)],
);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("📁"),
  category: text("category").notNull().default("Personal"),
  status: text("status").notNull().default("active"), // idea | active | paused | blocked | done
  progress: integer("progress").notNull().default(0),
  nextAction: text("next_action").notNull().default(""),
  notes: text("notes").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Recorded every time a project's progress changes, so the weekly review
// can show how far each project moved.
export const projectSnapshots = pgTable("project_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntries = pgTable("journal_entries", {
  date: date("date", { mode: "string" }).primaryKey(),
  mood: integer("mood"), // 1–5, optional
  body: text("body").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ReviewSummary = {
  tasksCompleted: number;
  tasksByCategory: Record<string, number>;
  habits: {
    sleepAvg: number | null;
    sleepDaysHit: number;
    waterDaysHit: number;
    creativeDays: number;
  };
  creativeMinutes: number;
  creativeByType: Record<string, number>;
  gymSessions: number;
  journalDays: number;
  projects: { id: string; name: string; emoji: string; from: number; to: number }[];
};

export const weeklyReviews = pgTable("weekly_reviews", {
  weekStart: date("week_start", { mode: "string" }).primaryKey(), // Monday
  summary: jsonb("summary").$type<ReviewSummary>().notNull(),
  wentWell: text("went_well").notNull().default(""),
  didnt: text("didnt").notNull().default(""),
  top3: jsonb("top3").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FeatureKey = "golden" | "assignments" | "shots" | "kit" | "gymPlan" | "pixels" | "morningPush" | "timetable";
export type TodayCardId = "weather" | "lesson" | "golden" | "assignments" | "events" | "tasks" | "habits" | "inbox";

export type GymExercise = { id: string; name: string; sets: number; reps: string; notes: string };
export type GymDay = { id: string; name: string; focus: string; exercises: GymExercise[] };

export type Place = { lat: number; lon: number; name: string };
export type SavedPlace = Place & { at: string; accuracy: number | null };

export type Settings = {
  sleepTarget: number;
  waterTarget: number;
  creativeTarget: number;
  gymNudge: boolean;
  features: Record<FeatureKey, boolean>;
  todayCards: { id: TodayCardId; visible: boolean }[];
  pixelsMode: "mood" | "productivity";
  shotTags: string[];
  gymPlan: GymDay[];
  pushEnabled: boolean;
  pushTime: string; // "HH:MM" in your time zone
  pushLastSent: string | null; // YYYY-MM-DD
  pushPrecisePingAt: string | null; // ISO – last time the 15-minute pinger called in
  locationMode: "current" | "fixed";
  fixedLocation: Place | null; // chosen via city search in Settings
  lastLocation: SavedPlace | null; // last device location reported by the app
  timetableGroup: string; // e.g. "3-1b"
  ownerName: string; // shown in the greeting and morning summary
};

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<Settings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// User-editable categories. Tasks/events/projects store the category *name*,
// so renaming a category cascades to them (see /api/categories/[id]).
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#9a9aa3"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shotIdeas = pgTable("shot_ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  bestTime: text("best_time").notNull().default("any"), // see SHOT_TIMES
  link: text("link").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  shot: boolean("shot").notNull().default(false),
  shotOn: date("shot_on", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kitLists = pgTable("kit_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🎒"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const kitItems = pgTable(
  "kit_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => kitLists.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    checked: boolean("checked").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("kit_items_list_idx").on(t.listId)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ShotIdea = typeof shotIdeas.$inferSelect;
export type KitList = typeof kitLists.$inferSelect;
export type KitItem = typeof kitItems.$inferSelect;
export type InboxItem = typeof inboxItems.$inferSelect;
export type CalEvent = typeof events.$inferSelect;
export type HabitEntry = typeof habitEntries.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type WeeklyReview = typeof weeklyReviews.$inferSelect;
