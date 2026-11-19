"use client";

import { IconDownload, IconLogout } from "@/components/Icons";
import { Button, Card, CardTitle, Field, PageHeader } from "@/components/ui";
import { saveSettings } from "@/lib/actions";
import { api, useSettings } from "@/lib/client";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export default function SettingsPage() {
  const { data } = useSettings();
  const s = data ?? DEFAULT_SETTINGS;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Habit targets</CardTitle>
          <div className="space-y-4">
            <Field label="Sleep (hours)">
              <input type="number" inputMode="decimal" step={0.5} min={1} max={14} className="field" value={s.sleepTarget} onChange={(e) => e.target.value && saveSettings({ sleepTarget: Number(e.target.value) })} />
            </Field>
            <Field label="Water (glasses)">
              <input type="number" inputMode="numeric" min={1} max={30} className="field" value={s.waterTarget} onChange={(e) => e.target.value && saveSettings({ waterTarget: Number(e.target.value) })} />
            </Field>
            <Field label="Creative practice (minutes a day)">
              <input type="number" inputMode="numeric" min={1} max={600} className="field" value={s.creativeTarget} onChange={(e) => e.target.value && saveSettings({ creativeTarget: Number(e.target.value) })} />
            </Field>
            <label className="flex min-h-12 items-center justify-between rounded-xl bg-card-2 px-4">
              <span>
                Gym nudges
                <span className="block text-[13px] text-muted">A gentle, optional reminder. Never a guilt trip.</span>
              </span>
              <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={s.gymNudge} onChange={(e) => saveSettings({ gymNudge: e.target.checked })} />
            </label>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle>Backup</CardTitle>
            <p className="mb-3 text-[15px] text-muted">Download everything (tasks, events, habits, projects, journal, reviews) as a JSON file.</p>
            <a href="/api/export" download>
              <Button variant="secondary" className="w-full">
                <IconDownload size={20} /> Export all data
              </Button>
            </a>
          </Card>
          <Card>
            <CardTitle>Account</CardTitle>
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                await api("/api/logout", "POST");
                window.location.href = "/login";
              }}
            >
              <IconLogout size={20} /> Sign out on this device
            </Button>
          </Card>
          <p className="px-2 text-[13px] text-faint">Life · times shown in Europe/London · weather from Open-Meteo</p>
        </div>
      </div>
    </>
  );
}
