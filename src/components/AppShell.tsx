"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/client";
import { Toaster } from "./Toast";
import { cx } from "./ui";
import {
  IconCalendar,
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
const SECONDARY = [
  { href: "/calendar", label: "Calendar", Icon: IconCalendar },
  { href: "/review", label: "Weekly review", Icon: IconReview },
  { href: "/settings", label: "Settings", Icon: IconSettings },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <SWRConfig value={swrConfig}>
      <Toaster />
      <div className="min-h-dvh md:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-3 py-6 md:flex lg:w-64">
          <Link href="/" className="mb-6 flex items-center gap-2.5 px-3">
            <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-[9px]" />
            <span className="text-[20px] font-bold tracking-tight">Life</span>
          </Link>
          <nav className="flex flex-col gap-0.5">
            {[...PRIMARY, ...SECONDARY.slice(0, 2)].map(({ href, label, Icon }) => (
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
    </SWRConfig>
  );
}

export { SECONDARY as SECONDARY_NAV };
