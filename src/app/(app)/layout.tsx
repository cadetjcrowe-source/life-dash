import { AppShell } from "@/components/AppShell";

// Render per request so "today" (Europe/London) is never baked in at build time.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
