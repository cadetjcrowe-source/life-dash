export const CATEGORIES = ["College", "Cadets", "Roblox dev", "Music", "Personal", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

// Muted category colours (work in light + dark). `dot` is the solid swatch,
// `soft` is a translucent background tint.
export const CATEGORY_COLORS: Record<string, { dot: string; soft: string }> = {
  College: { dot: "#6E8FD8", soft: "rgba(110,143,216,0.16)" },
  Cadets: { dot: "#7FA37A", soft: "rgba(127,163,122,0.18)" },
  "Roblox dev": { dot: "#D69A5C", soft: "rgba(214,154,92,0.18)" },
  Music: { dot: "#B184C9", soft: "rgba(177,132,201,0.18)" },
  Personal: { dot: "#5FAFAA", soft: "rgba(95,175,170,0.18)" },
  Other: { dot: "#9A9AA3", soft: "rgba(154,154,163,0.18)" },
};

export const categoryColor = (c: string) => CATEGORY_COLORS[c] ?? CATEGORY_COLORS.Other;

export const PRIORITIES = [
  { value: 3, label: "High" },
  { value: 2, label: "Medium" },
  { value: 1, label: "Low" },
] as const;

export const PROJECT_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
] as const;

export const CREATIVE_TYPES = [
  { value: "music", label: "Music production", emoji: "🎧" },
  { value: "editing", label: "Editing", emoji: "🎬" },
  { value: "photography", label: "Photography", emoji: "📷" },
] as const;

export const MOODS = [
  { value: 1, emoji: "😞", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

export const REPEATS = [
  { value: "none", label: "Doesn't repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "fortnightly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
] as const;

export const DEFAULT_SETTINGS = {
  sleepTarget: 8,
  waterTarget: 8,
  creativeTarget: 20,
  gymNudge: true,
};

export const RAMSEY = { lat: 54.32, lon: -4.38, name: "Ramsey" };
