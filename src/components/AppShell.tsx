"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SWRConfig } from "swr";
import { useEffect } from "react";
import { CategoriesProvider } from "@/lib/categories";
import { LocationProvider } from "@/lib/location-client";
import { swrConfig, useSettings } from "@/lib/client";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { FeatureKey } from "@/db/schema";
import { Toaster } from "./Toast";
import { cx } from "./ui";
import {
  IconCalendar,
  IconCamera,
  IconChecklist,
  IconDumbbell,
  IconGrid,
  IconTimetable,
  IconHabits,
  IconJournal,
  IconProjects,
  IconReview,
  IconSettings,
  IconTasks,
  IconToday,
} from "./Icons";

const PRIMARY = [
  { href: "/", label: "Today", Icon: IconToday },
  { href: "/tasks", label: "Tasks", Icon: IconTasks },
  { href: "/habits", label: "Habits", Icon: IconHabits },
  { href: "/projects", label: "Projects", Icon: IconProjects },
  { href: "/journal", label: "Journal", Icon: IconJournal },
];
type NavItem = { href: string; label: string; Icon: typeof IconToday; feature?: FeatureKey };
const SECONDARY: NavItem[] = [
  { href: "/timetable", label: "Timetable", Icon: IconTimetable, feature: "timetable" },
  { href: "/calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/review", label: "Weekly review", Icon: IconReview },
  { href: "/shots", label: "Shot ideas", Icon: IconCamera, feature: "shots" },
  { href: "/kit", label: "Kit lists", Icon: IconChecklist, feature: "kit" },
  { href: "/gym", label: "Gym plan", Icon: IconDumbbell, feature: "gymPlan" },
  { href: "/pixels", label: "Year in pixels", Icon: IconGrid, feature: "pixels" },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

/** Secondary pages, minus any whose feature is switched off in Settings. */
export function useSecondaryNav() {
  const { data } = useSettings();
  const features = data?.features ?? DEFAULT_SETTINGS.features;
  return SECONDARY.filter((n) => !n.feature || features[n.feature]);
}

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const secondary = useSecondaryNav();
  useEffect(() => {
    // Service worker: needed for push notifications on the installed iPhone app.
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return (
    <>
      <Toaster />
      <div className="min-h-dvh md:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-3 py-6 md:flex lg:w-64">
          <Link href="/" className="mb-6 flex items-center gap-2.5 px-3">
            <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-[9px]" />
            <span className="text-[20px] font-bold tracking-tight">Life</span>
          </Link>
          <nav className="flex flex-col gap-0.5">
            {[...PRIMARY, ...secondary.filter((n) => n.href !== "/settings")].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[16px] font-medium transition",
                  isActive(path, href) ? "bg-accent-soft text-accent" : "text-text hover:bg-card",
                )}
              >
                <Icon size={21} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <Link
              href="/settings"
              className={cx(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[16px] font-medium transition",
                isActive(path, "/settings") ? "bg-accent-soft text-accent" : "text-muted hover:bg-card",
              )}
            >
              <IconSettings size={21} />
              Settings
            </Link>
          </div>
        </aside>

        <main className="pb-tabbar mx-auto w-full min-w-0 max-w-[1400px] px-4 pt-safe md:px-8">{children}</main>
      </div>

      {/* Mobile tab bar */}
      <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t border-line pb-safe md:hidden" aria-label="Main">
        <div className="mx-auto flex max-w-lg">
          {PRIMARY.map(({ href, label, Icon }) => {
            const active = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition press press-strong",
                  active ? "text-accent" : "text-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span key={active ? "on" : "off"} className={active ? "anim-symbol" : undefined}>
                  <Icon size={26} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <CategoriesProvider>
        <LocationProvider>
          <Shell>{children}</Shell>
        </LocationProvider>
      </CategoriesProvider>
    </SWRConfig>
  );
}
