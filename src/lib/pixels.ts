// Shared types + scoring for the Year in Pixels view.

export type PixelDay = {
  mood: number | null;
  tasks: number;
  water: number;
  sleep: number;
  creative: number;
  gym: number;
  hasJournal: boolean;
  score: number; // 0–4 productivity level
};

export type PixelYear = { year: number; days: Record<string, PixelDay> };

/**
 * Productivity score: up to 3 points for tasks done, plus 1 each for hitting
 * water, sleep, any creative practice and any gym session (max 7), bucketed to 0–4.
 */
export function productivityLevel(d: Omit<PixelDay, "score" | "mood" | "hasJournal">, t: { water: number; sleep: number }): number {
  const pts = Math.min(d.tasks, 3) + (d.water >= t.water ? 1 : 0) + (d.sleep >= t.sleep ? 1 : 0) + (d.creative > 0 ? 1 : 0) + (d.gym > 0 ? 1 : 0);
  return pts === 0 ? 0 : Math.min(4, Math.ceil((pts / 7) * 4));
}

// Mood: diverging scale with a neutral grey midpoint ("Okay").
export const MOOD_COLORS: Record<number, string> = {
  // Validated for colour-blind separation between neighbours (dataviz validator).
  1: "#B9434B",
  2: "#E2826A",
  3: "#BDBDC4",
  4: "#4FAE78",
  5: "#23744A",
};

// Productivity: one hue (the accent), light → dark.
export const PRODUCTIVITY_COLORS = [
  "",
  "color-mix(in srgb, var(--accent) 25%, var(--card))",
  "color-mix(in srgb, var(--accent) 48%, var(--card))",
  "color-mix(in srgb, var(--accent) 72%, var(--card))",
  "var(--accent)",
];
export const PRODUCTIVITY_LABELS = ["Nothing logged", "Light", "Decent", "Strong", "Brilliant"];
