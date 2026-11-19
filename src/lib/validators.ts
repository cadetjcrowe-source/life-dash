import { z } from "zod";
import { CATEGORIES } from "./constants";
import { hm, ymd } from "./http";

const category = z.enum(CATEGORIES);

export const taskInput = z.object({
  id: z.uuid().optional(), // client-generated ids allow optimistic inserts
  title: z.string().trim().min(1).max(300),
  notes: z.string().max(5000).optional(),
  dueDate: ymd.nullable().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  category: category.optional(),
  pinned: z.boolean().optional(),
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

export const settingsInput = z.object({
  sleepTarget: z.number().min(1).max(14).optional(),
  waterTarget: z.number().int().min(1).max(30).optional(),
  creativeTarget: z.number().int().min(1).max(600).optional(),
  gymNudge: z.boolean().optional(),
});
