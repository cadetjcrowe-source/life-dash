import { z } from "zod";
import { hm, ymd } from "./http";

const category = z.string().trim().min(1).max(40);

export const taskInput = z.object({
  id: z.uuid().optional(), // client-generated ids allow optimistic inserts
  title: z.string().trim().min(1).max(300),
  notes: z.string().max(5000).optional(),
  dueDate: ymd.nullable().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  category: category.optional(),
  pinned: z.boolean().optional(),
  isAssignment: z.boolean().optional(),
});
export const taskPatch = taskInput.omit({ id: true }).partial().extend({ done: z.boolean().optional() });

export const inboxInput = z.object({ id: z.uuid().optional(), text: z.string().trim().min(1).max(2000) });

const eventBase = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1).max(200),
  date: ymd,
  startTime: hm.nullable().optional(),
  endTime: hm.nullable().optional(),
  location: z.string().max(200).optional(),
  category: category.optional(),
  repeat: z.enum(["none", "daily", "weekly", "fortnightly", "monthly"]).optional(),
  repeatUntil: ymd.nullable().optional(),
  excludedDates: z.array(ymd).max(500).optional(),
  kind: z.enum(["event", "lesson"]).optional(),
});
export const eventInput = eventBase;
export const eventPatch = eventBase.omit({ id: true }).partial();

export const habitInput = z.object({
  id: z.uuid().optional(),
  date: ymd,
  kind: z.enum(["sleep", "water", "creative", "gym"]),
  value: z.number().min(0).max(1440),
  subtype: z.enum(["music", "editing", "photography"]).nullable().optional(),
  note: z.string().max(500).optional(),
});

const status = z.enum(["idea", "active", "paused", "blocked", "done"]);
export const projectInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  emoji: z.string().max(8).optional(),
  category: category.optional(),
  status: status.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  nextAction: z.string().max(500).optional(),
  notes: z.string().max(10000).optional(),
});
export const projectPatch = projectInput.omit({ id: true }).partial().extend({ archived: z.boolean().optional() });

export const journalInput = z.object({
  mood: z.number().int().min(1).max(5).nullable().optional(),
  body: z.string().max(50000).optional(),
});

export const reviewInput = z.object({
  wentWell: z.string().max(10000).optional(),
  didnt: z.string().max(10000).optional(),
  top3: z.array(z.string().max(300)).max(3).optional(),
});

export const place = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  name: z.string().trim().min(1).max(120),
});
export const deviceLocation = place.extend({ accuracy: z.number().min(0).max(100_000).nullable().optional() });

const featureKey = z.enum(["golden", "assignments", "shots", "kit", "gymPlan", "pixels", "morningPush", "timetable"]);
const gymExercise = z.object({
  id: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(100),
  sets: z.number().int().min(1).max(20),
  reps: z.string().max(30),
  notes: z.string().max(1000),
});
const gymDay = z.object({
  id: z.string().min(1).max(60),
  name: z.string().trim().min(1).max(60),
  focus: z.string().max(60),
  exercises: z.array(gymExercise).max(30),
});

export const settingsInput = z.object({
  sleepTarget: z.number().min(1).max(14).optional(),
  waterTarget: z.number().int().min(1).max(30).optional(),
  creativeTarget: z.number().int().min(1).max(600).optional(),
  gymNudge: z.boolean().optional(),
  features: z.partialRecord(featureKey, z.boolean()).optional(),
  todayCards: z
    .array(z.object({ id: z.enum(["weather", "lesson", "golden", "assignments", "events", "tasks", "habits", "inbox"]), visible: z.boolean() }))
    .max(20)
    .optional(),
  pixelsMode: z.enum(["mood", "productivity"]).optional(),
  shotTags: z.array(z.string().trim().min(1).max(30)).max(50).optional(),
  gymPlan: z.array(gymDay).max(7).optional(),
  pushEnabled: z.boolean().optional(),
  pushTime: hm.optional(),
  locationMode: z.enum(["current", "fixed"]).optional(),
  fixedLocation: place.nullable().optional(),
  timetableGroup: z.string().trim().max(30).optional(),
  ownerName: z.string().trim().max(40).optional(),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "expected a #RRGGBB colour");
export const categoryInput = z.object({ id: z.uuid().optional(), name: category, color: hex.optional() });
export const categoryPatch = z.object({ name: category.optional(), color: hex.optional() });

// Only http(s) links – blocks javascript:/data: URLs that could run code when tapped.
const webUrl = z.url({ protocol: /^https?$/, hostname: z.regexes.domain }).max(2000);

export const shotInput = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  bestTime: z.enum(["golden-morning", "morning", "midday", "golden-evening", "blue-hour", "night", "any"]).optional(),
  link: z.union([webUrl, z.literal("")]).optional(),
  imageUrl: z.union([webUrl, z.literal("")]).optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
});
export const shotPatch = shotInput.omit({ id: true }).partial().extend({ shot: z.boolean().optional() });

export const kitListInput = z.object({ id: z.uuid().optional(), name: z.string().trim().min(1).max(80), emoji: z.string().max(8).optional() });
export const kitItemInput = z.object({ id: z.uuid().optional(), listId: z.uuid(), text: z.string().trim().min(1).max(200) });
export const kitItemPatch = z.object({ text: z.string().trim().min(1).max(200).optional(), checked: z.boolean().optional() });
