import type { FeatureKey, GymDay, Settings, TodayCardId } from "@/db/schema";

// Starting categories (stored in the `categories` table, editable in Settings).
// (Only used for a moment while the real list loads.)
export const DEFAULT_CATEGORIES = [
  { name: "Study", color: "#6E8FD8" },
  { name: "Work", color: "#D69A5C" },
  { name: "Personal", color: "#5FAFAA" },
  { name: "Health", color: "#7FA37A" },
  { name: "Creative", color: "#B184C9" },
  { name: "Other", color: "#9A9AA3" },
];

// Muted swatches offered when recolouring a category.
export const CATEGORY_SWATCHES = [
  "#6E8FD8", "#7FA37A", "#D69A5C", "#B184C9", "#5FAFAA", "#9A9AA3",
  "#D9798A", "#C9A94E", "#6FA8C9", "#8C8FD9", "#A3896B", "#7FB59A",
];

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

export const FEATURES: { key: FeatureKey; label: string; description: string }[] = [
  { key: "timetable", label: "College timetable", description: "Weekly lessons and a next-lesson countdown" },
  { key: "golden", label: "Golden hour", description: "Sunrise, sunset & golden hour countdown on Today" },
  { key: "assignments", label: "Assignment countdowns", description: "Big days-left cards for assignments" },
  { key: "shots", label: "Shot ideas", description: "Board of photo & video ideas" },
  { key: "kit", label: "Kit lists", description: "Reusable packing checklists" },
  { key: "gymPlan", label: "Gym plan", description: "Beginner full-body routine" },
  { key: "pixels", label: "Year in pixels", description: "Your year at a glance" },
  { key: "morningPush", label: "Morning summary", description: "A notification each morning" },
];

export const TODAY_CARDS: { id: TodayCardId; label: string; feature?: FeatureKey }[] = [
  { id: "weather", label: "Weather" },
  { id: "lesson", label: "Next lesson", feature: "timetable" },
  { id: "golden", label: "Golden hour", feature: "golden" },
  { id: "assignments", label: "Assignment countdowns", feature: "assignments" },
  { id: "events", label: "Today's events" },
  { id: "tasks", label: "Top 3 tasks" },
  { id: "habits", label: "Habits" },
  { id: "inbox", label: "Inbox reminder" },
];

const ex = (id: string, name: string, sets: number, reps: string, notes: string) => ({ id, name, sets, reps, notes });

// A gentle 3-day full-body starter plan (e.g. Mon / Wed / Fri). Fully editable.
export const DEFAULT_GYM_PLAN: GymDay[] = [
  {
    id: "day-a",
    name: "Day A",
    focus: "Full body",
    exercises: [
      ex("a1", "Goblet squat", 3, "10", "Hold a dumbbell at your chest, feet shoulder-width. Sit down between your heels, chest up, then stand tall."),
      ex("a2", "Push-ups (or knee push-ups)", 3, "8–10", "Hands under shoulders, body in a straight line. Lower your chest to a fist's height off the floor."),
      ex("a3", "Lat pulldown", 3, "10", "Grip just wider than shoulders. Pull the bar to your upper chest, squeezing your shoulder blades down."),
      ex("a4", "Dumbbell Romanian deadlift", 3, "10", "Soft knees, push your hips back and slide the weights down your thighs until you feel a hamstring stretch."),
      ex("a5", "Plank", 3, "20–30 s", "Elbows under shoulders, squeeze your glutes, don't let your hips sag."),
    ],
  },
  {
    id: "day-b",
    name: "Day B",
    focus: "Full body",
    exercises: [
      ex("b1", "Leg press", 3, "10", "Feet hip-width on the platform. Lower until knees are at about 90°, then push through your heels."),
      ex("b2", "Seated cable row", 3, "10", "Sit tall, pull the handle to your belly button, pause, return slowly."),
      ex("b3", "Dumbbell shoulder press", 3, "8–10", "Seated with back support. Press up without arching your lower back."),
      ex("b4", "Glute bridge", 3, "12", "Lie on your back, feet flat. Drive your hips up and squeeze for a second at the top."),
      ex("b5", "Dead bug", 3, "8 each side", "Lower back pressed to the floor. Slowly extend opposite arm and leg, then switch."),
    ],
  },
  {
    id: "day-c",
    name: "Day C",
    focus: "Full body",
    exercises: [
      ex("c1", "Reverse lunges", 3, "8 each leg", "Step back, lower your back knee towards the floor, push through your front heel to return."),
      ex("c2", "Incline dumbbell press", 3, "10", "Bench at a low incline. Lower the weights to chest level, press up and slightly in."),
      ex("c3", "Assisted pull-up or pulldown", 3, "8", "Use the assisted machine or pulldown. Pull your chest towards the bar, control the way down."),
      ex("c4", "Kettlebell / dumbbell deadlift", 3, "10", "Weight between your feet, flat back, push the floor away to stand up."),
      ex("c5", "Farmer's carry", 3, "30 m", "Heavy-ish dumbbells at your sides, walk tall and slow."),
    ],
  },
];

export const SHOT_TIMES = [
  { value: "golden-morning", label: "Morning golden hour", emoji: "🌅" },
  { value: "morning", label: "Morning", emoji: "🌤️" },
  { value: "midday", label: "Midday", emoji: "☀️" },
  { value: "golden-evening", label: "Evening golden hour", emoji: "🌇" },
  { value: "blue-hour", label: "Blue hour", emoji: "🌆" },
  { value: "night", label: "Night", emoji: "🌙" },
  { value: "any", label: "Any time", emoji: "🕐" },
] as const;

export const DEFAULT_SETTINGS: Settings = {
  sleepTarget: 8,
  waterTarget: 8,
  creativeTarget: 20,
  gymNudge: true,
  features: { golden: true, assignments: true, shots: true, kit: true, gymPlan: true, pixels: true, morningPush: true, timetable: true },
  todayCards: TODAY_CARDS.map((c) => ({ id: c.id, visible: true })),
  pixelsMode: "mood",
  shotTags: ["Drone", "Landscape", "Portrait", "Street", "Video", "Astro", "Coast"],
  gymPlan: DEFAULT_GYM_PLAN,
  pushEnabled: false,
  pushTime: "07:30",
  pushLastSent: null,
  pushPrecisePingAt: null,
  locationMode: "current",
  fixedLocation: null,
  lastLocation: null,
  timetableGroup: "",
  ownerName: "",
};

/** Fill in any settings keys added since the user's settings were first saved. */
export function withDefaults(saved: Partial<Settings> | null | undefined): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(saved ?? {}) } as Settings;
  s.features = { ...DEFAULT_SETTINGS.features, ...(saved?.features ?? {}) };
  const known = new Set(TODAY_CARDS.map((c) => c.id));
  const cards = (saved?.todayCards ?? []).filter((c) => known.has(c.id));
  // Cards added in newer versions slot in at their default position.
  TODAY_CARDS.forEach((c, i) => {
    if (!cards.some((x) => x.id === c.id)) cards.splice(Math.min(i, cards.length), 0, { id: c.id, visible: true });
  });
  s.todayCards = cards;
  return s;
}

