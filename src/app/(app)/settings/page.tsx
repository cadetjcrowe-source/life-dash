"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import type { Category } from "@/db/schema";
import { IconBell, IconMapPin, IconSearch, IconChevronDown, IconChevronRight, IconChevronUp, IconClose, IconDownload, IconLogout, IconPlus } from "@/components/Icons";
import { toast } from "@/components/Toast";
import { Button, Card, CardTitle, Field, IconButton, PageHeader, Segmented, SettingRow, Switch, cx } from "@/components/ui";
import { addCategory, deleteCategory, reorderCategories, saveSettings, updateCategory } from "@/lib/actions";
import { useCategoriesQuery } from "@/lib/categories";
import { api, useSettings } from "@/lib/client";
import { CATEGORY_SWATCHES, DEFAULT_SETTINGS, FEATURES, TODAY_CARDS } from "@/lib/constants";
import { searchCities, useLocation, type CityResult } from "@/lib/location-client";
import { DEFAULT_PLACE, shortName } from "@/lib/location";
import { TZ, relativeDay, today as londonToday, toLondonDate } from "@/lib/dates";
import { currentSubscription, disablePush, enablePush, isIOS, isStandalone, pushSupported, type PushInfo } from "@/lib/push-client";

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

function OrderButtons({ i, n, onMove, label }: { i: number; n: number; onMove: (dir: -1 | 1) => void; label: string }) {
  return (
    <div className="flex shrink-0">
      <IconButton label={`Move ${label} up`} onClick={() => onMove(-1)} disabled={i === 0} className="!h-10 !w-10 disabled:opacity-20">
        <IconChevronUp size={20} />
      </IconButton>
      <IconButton label={`Move ${label} down`} onClick={() => onMove(1)} disabled={i === n - 1} className="!h-10 !w-10 disabled:opacity-20">
        <IconChevronDown size={20} />
      </IconButton>
    </div>
  );
}

export default function SettingsPage() {
  const { data } = useSettings();
  const s = data ?? DEFAULT_SETTINGS;

  return (
    <>
      <PageHeader title="Settings" />
      <div className="gap-4 md:columns-2 2xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        <Card>
          <CardTitle>You</CardTitle>
          <div className="space-y-4">
            <TextSetting label="Your name" hint="Used in the greeting and the morning summary" value={s.ownerName} placeholder="e.g. Jacob" onSave={(v) => saveSettings({ ownerName: v })} />
            {s.features.timetable && (
              <TextSetting label="Timetable group" hint="Shown on the Timetable page" value={s.timetableGroup} placeholder="e.g. 3-1b" onSave={(v) => saveSettings({ timetableGroup: v })} />
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Today screen</CardTitle>
          <p className="mb-2 text-[14px] text-muted">Choose which cards show and in what order.</p>
          <ul className="divide-y divide-line">
            {s.todayCards.map((c, i) => {
              const meta = TODAY_CARDS.find((m) => m.id === c.id)!;
              const featureOff = meta.feature && !s.features[meta.feature];
              return (
                <li key={c.id} className="flex items-center gap-1 py-1.5">
                  <OrderButtons i={i} n={s.todayCards.length} label={meta.label} onMove={(d) => saveSettings({ todayCards: move(s.todayCards, i, d) })} />
                  <span className={cx("flex-1 text-[16px]", (!c.visible || featureOff) && "text-muted")}>
                    {meta.label}
                    {featureOff && <span className="block text-[12px] text-faint">Feature is off</span>}
                  </span>
                  <Switch
                    label={`Show ${meta.label}`}
                    checked={c.visible}
                    onChange={(v) => saveSettings({ todayCards: s.todayCards.map((x) => (x.id === c.id ? { ...x, visible: v } : x)) })}
                  />
                </li>
              );
            })}
          </ul>
        </Card>

        <LocationCard />

        <Card>
          <CardTitle>Features</CardTitle>
          <div className="divide-y divide-line">
            {FEATURES.map((f) => (
              <SettingRow key={f.key} title={f.label} description={f.description}>
                <Switch label={f.label} checked={s.features[f.key]} onChange={(v) => saveSettings({ features: { [f.key]: v } })} />
              </SettingRow>
            ))}
          </div>
        </Card>

        <CategoriesCard />

        {s.features.morningPush && <MorningCard />}

        <Card>
          <CardTitle>Extras</CardTitle>
          <div className="space-y-4">
            {s.features.pixels && (
              <Field label="Year in pixels colours">
                <Segmented
                  value={s.pixelsMode}
                  onChange={(v) => saveSettings({ pixelsMode: v })}
                  options={[
                    { value: "mood", label: "Mood" },
                    { value: "productivity", label: "Productivity" },
                  ]}
                />
              </Field>
            )}
            {s.features.shots && <ShotTagsEditor tags={s.shotTags} />}
            <div className="divide-y divide-line">
              {s.features.kit && <LinkRow href="/kit" label="🎒 Edit kit lists" />}
              {s.features.gymPlan && <LinkRow href="/gym" label="💪 Edit gym plan" />}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Habit targets</CardTitle>
          <div className="space-y-4">
            <NumberField label="Sleep (hours)" value={s.sleepTarget} step={0.5} min={1} max={14} onSave={(v) => saveSettings({ sleepTarget: v })} />
            <NumberField label="Water (glasses)" value={s.waterTarget} min={1} max={30} onSave={(v) => saveSettings({ waterTarget: Math.round(v) })} />
            <NumberField label="Creative practice (minutes a day)" value={s.creativeTarget} min={1} max={600} onSave={(v) => saveSettings({ creativeTarget: Math.round(v) })} />
            <SettingRow title="Gym nudges" description="A gentle, optional reminder. Never a guilt trip.">
              <Switch label="Gym nudges" checked={s.gymNudge} onChange={(v) => saveSettings({ gymNudge: v })} />
            </SettingRow>
          </div>
        </Card>

        <Card>
          <CardTitle>Backup</CardTitle>
          <p className="mb-3 text-[15px] text-muted">Download everything as a JSON file.</p>
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
          <p className="mt-3 text-[13px] text-faint">Life · times in {TZ} · weather from Open-Meteo</p>
        </Card>
      </div>
    </>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex min-h-12 items-center justify-between text-[16px]">
      {label}
      <IconChevronRight className="text-faint" />
    </Link>
  );
}

/** Text input that saves when you finish editing. */
function TextSetting({ label, hint, value, placeholder, onSave }: { label: string; hint?: string; value: string; placeholder?: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <Field label={label} hint={hint}>
      <input
        className="field"
        value={v}
        maxLength={40}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v.trim() !== value && onSave(v.trim())}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
    </Field>
  );
}

/** Number input that only saves valid values when you finish editing. */
function NumberField({ label, value, onSave, step = 1, min, max }: { label: string; value: number; onSave: (v: number) => void; step?: number; min: number; max: number }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const commit = () => {
    const n = Number(v);
    if (Number.isFinite(n) && n >= min && n <= max) {
      if (n !== value) onSave(n);
    } else setV(String(value));
  };
  return (
    <Field label={label}>
      <input type="number" inputMode="decimal" step={step} min={min} max={max} className="field" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
    </Field>
  );
}

function CategoriesCard() {
  const { data } = useCategoriesQuery();
  const cats = data ?? [];
  const [picking, setPicking] = useState<string | null>(null);
  const [name, setName] = useState("");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (cats.some((c) => c.name.toLowerCase() === n.toLowerCase())) return toast("That category already exists");
    addCategory(n, CATEGORY_SWATCHES[cats.length % CATEGORY_SWATCHES.length]);
    setName("");
  };

  return (
    <Card>
      <CardTitle>Categories</CardTitle>
      <p className="mb-2 text-[14px] text-muted">Renaming updates every task, event and project using it.</p>
      <ul className="divide-y divide-line">
        {cats.map((c, i) => (
          <li key={c.id} className="py-1.5">
            <div className="flex items-center gap-1">
              <OrderButtons i={i} n={cats.length} label={c.name} onMove={(d) => reorderCategories(move(cats, i, d).map((x) => x.id))} />
              <button
                onClick={() => setPicking(picking === c.id ? null : c.id)}
                aria-label={`Colour for ${c.name}`}
                className="press press-strong mx-1 h-8 w-8 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <CategoryName cat={c} others={cats} />
              <IconButton
                label={`Delete ${c.name}`}
                className="text-faint"
                disabled={cats.length <= 1}
                onClick={() => {
                  const target = cats.find((x) => x.id !== c.id && x.name === "Other") ?? cats.find((x) => x.id !== c.id);
                  if (confirm(`Delete "${c.name}"? Anything in it will move to "${target?.name}".`)) deleteCategory(c.id);
                }}
              >
                <IconClose size={18} />
              </IconButton>
            </div>
            {picking === c.id && (
              <div className="anim-rise ml-[84px] mt-2 flex flex-wrap gap-2 pb-1">
                {CATEGORY_SWATCHES.map((col) => (
                  <button
                    key={col}
                    aria-label={`Use colour ${col}`}
                    onClick={() => {
                      updateCategory(c.id, { color: col });
                      setPicking(null);
                    }}
                    className={cx("press press-strong h-9 w-9 rounded-full", c.color.toLowerCase() === col.toLowerCase() && "ring-2 ring-text ring-offset-2 ring-offset-card")}
                    style={{ background: col }}
                  />
                ))}
                <label className="press relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-card-2 text-muted" aria-label="Custom colour">
                  <IconPlus size={16} />
                  <input type="color" className="absolute inset-0 opacity-0" value={c.color} onChange={(e) => updateCategory(c.id, { color: e.target.value })} />
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="field" placeholder="New category" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <Button type="submit" variant="secondary" disabled={!name.trim()} aria-label="Add category">
          <IconPlus size={20} />
        </Button>
      </form>
    </Card>
  );
}

function CategoryName({ cat, others }: { cat: Category; others: Category[] }) {
  const [v, setV] = useState(cat.name);
  useEffect(() => setV(cat.name), [cat.name]);
  const commit = () => {
    const n = v.trim();
    if (!n || n === cat.name) return setV(cat.name);
    if (others.some((o) => o.id !== cat.id && o.name.toLowerCase() === n.toLowerCase())) {
      toast("That name is already used");
      return setV(cat.name);
    }
    updateCategory(cat.id, { name: n });
  };
  return (
    <input
      className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[16px] outline-none focus:bg-card-2"
      value={v}
      maxLength={40}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label={`Rename ${cat.name}`}
    />
  );
}

function ShotTagsEditor({ tags }: { tags: string[] }) {
  const [t, setT] = useState("");
  return (
    <Field label="Shot idea tags">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-accent-soft pl-3 pr-1 text-[15px] font-medium text-accent">
            #{tag}
            <button aria-label={`Remove ${tag}`} onClick={() => saveSettings({ shotTags: tags.filter((x) => x !== tag) })} className="flex h-7 w-7 items-center justify-center rounded-full">
              <IconClose size={14} />
            </button>
          </span>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = t.trim().replace(/^#/, "");
          if (v && !tags.includes(v)) saveSettings({ shotTags: [...tags, v] });
          setT("");
        }}
      >
        <input className="field" placeholder="Add a tag" value={t} onChange={(e) => setT(e.target.value)} maxLength={30} />
        <Button type="submit" variant="secondary" disabled={!t.trim()} aria-label="Add tag">
          <IconPlus size={20} />
        </Button>
      </form>
    </Field>
  );
}

type Keys = { VAPID_PUBLIC_KEY: string; VAPID_PRIVATE_KEY: string; CRON_SECRET: string };

function MorningCard() {
  const { data: settings } = useSettings();
  const s = settings ?? DEFAULT_SETTINGS;
  const { data: info, mutate } = useSWR<PushInfo>("/api/push/subscribe", { refreshInterval: 0 });
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [keys, setKeys] = useState<Keys | null>(null);
  const [time, setTime] = useState(s.pushTime);
  useEffect(() => setTime(s.pushTime), [s.pushTime]);
  useEffect(() => {
    currentSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  // Device checks only exist in the browser – work them out after mounting.
  const [device, setDevice] = useState<{ supported: boolean; needsInstall: boolean } | null>(null);
  useEffect(() => setDevice({ supported: pushSupported(), needsInstall: isIOS() && !isStandalone() }), []);
  const needsInstall = device?.needsInstall ?? false;
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    try {
      await fn();
      if (done) toast(done);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong");
    }
    setBusy(false);
  };

  return (
    <Card>
      <CardTitle icon={<IconBell size={18} />}>Morning summary</CardTitle>
      <p className="mb-3 text-[14px] text-muted">A notification each morning with the weather, golden hour and your top 3 tasks.</p>

      {info && !info.configured ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-warn-soft p-3 text-[15px] text-warn">
            {info.problem === "mismatch"
              ? "The two push keys in Vercel don't belong together. Tap Generate, then replace BOTH VAPID keys in Vercel and redeploy."
              : info.problem === "invalid"
                ? "One of the push keys in Vercel wasn't pasted correctly (it may be cut short or in the wrong box). Tap Generate, then replace BOTH VAPID keys in Vercel and redeploy."
                : "One-time setup needed: add three values to Vercel (see the README, \"Morning notifications\")."}
          </p>
          {!keys ? (
            <Button variant="secondary" className="w-full" disabled={busy} onClick={() => run(async () => setKeys(await api<Keys>("/api/push/keys", "POST")))}>
              Generate the values
            </Button>
          ) : (
            <div className="space-y-2">
              {(Object.keys(keys) as (keyof Keys)[]).map((k) => (
                <div key={k} className="rounded-xl bg-card-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[13px] font-semibold">{k}</code>
                    <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(keys[k]).then(() => toast("Copied"))}>
                      Copy
                    </Button>
                  </div>
                  <code className="mt-1 block break-all text-[12px] text-muted">{keys[k]}</code>
                </div>
              ))}
              <p className="text-[14px] text-muted">In Vercel → Settings → Environment Variables, add or replace each one (edit the existing entry if there is one, so there are no duplicates), then Redeploy.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-line">
          <SettingRow title="Send it each morning">
            <Switch label="Morning summary" checked={s.pushEnabled} onChange={(v) => saveSettings({ pushEnabled: v })} />
          </SettingRow>
          <SettingRow title="Time" description="Between 06:00 and 10:30">
            <input
              type="time"
              className="field !w-32"
              min="06:00"
              max="10:30"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => /^\d\d:\d\d$/.test(time) && time !== s.pushTime && saveSettings({ pushTime: time < "06:00" ? "06:00" : time > "10:30" ? "10:30" : time })}
            />
          </SettingRow>
          <div className="py-3">
            {!device ? null : !device.supported || needsInstall ? (
              <p className="rounded-xl bg-card-2 p-3 text-[15px]">
                📲 {needsInstall ? "On iPhone, notifications only work from the installed app. Add Life to your Home Screen (Share → Add to Home Screen), open it from there, then come back here." : "This browser doesn't support notifications."}
              </p>
            ) : subscribed ? (
              <div className="flex flex-wrap gap-2">
                <span className="flex-1 self-center text-[15px] text-good">✓ This device will get notifications</span>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(async () => { await disablePush(); setSubscribed(false); mutate(); }, "Turned off on this device")}>
                  Turn off here
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={busy || !info?.publicKey}
                onClick={() =>
                  run(async () => {
                    await enablePush(info!.publicKey!);
                    setSubscribed(true);
                    if (!s.pushEnabled) await saveSettings({ pushEnabled: true });
                    mutate();
                  }, "Notifications on 🔔")
                }
              >
                <IconBell size={20} /> Allow notifications on this device
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 pt-3">
            <span className="text-[14px] text-muted">
              {info?.devices ?? 0} device{info?.devices === 1 ? "" : "s"} registered
            </span>
            <Button size="sm" variant="secondary" disabled={busy || !info?.devices} onClick={() => run(() => api("/api/push/test", "POST"), "Test sent")}>
              Send a test
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function LocationCard() {
  const { data } = useSettings();
  const s = data ?? DEFAULT_SETTINGS;
  const { place, status, refresh } = useLocation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CityResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Search as you type (debounced).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setResults(null);
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchCities(term));
      } catch (e) {
        toast(e instanceof Error ? e.message : "Search failed");
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const last = s.lastLocation;
  const lastSeen = last
    ? `${toLondonDate(last.at) === londonToday() ? "today" : relativeDay(toLondonDate(last.at)).toLowerCase()} at ${new Date(last.at).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}`
    : null;

  return (
    <Card>
      <CardTitle icon={<IconMapPin size={18} />}>Location</CardTitle>
      <p className="mb-3 text-[14px] text-muted">Used for the weather, golden hour and the morning summary.</p>
      <Segmented
        value={s.locationMode}
        onChange={async (v) => {
          await saveSettings({ locationMode: v });
          // Weather is worked out on the server from the saved mode, so refetch once it's saved.
          await mutate("/api/weather");
          if (v === "current") refresh();
        }}
        options={[
          { value: "current", label: "Current location" },
          { value: "fixed", label: "Fixed location" },
        ]}
      />

      <div className="mt-3 rounded-2xl bg-card-2 p-3.5">
        <p className="text-[13px] font-medium text-muted">Now showing</p>
        <p className="text-[18px] font-semibold">{shortName(place.name)}</p>
        <p className="text-[13px] text-muted">
          {place.source === "fixed"
            ? place.name
            : place.source === "device"
              ? `Last updated ${lastSeen}${status === "denied" ? " · location access is off" : ""}`
              : status === "denied"
                ? `Location access is off, so using the default (${shortName(DEFAULT_PLACE.name)})`
                : "Default — no location saved yet"}
        </p>
      </div>

      {s.locationMode === "current" ? (
        <Button variant="secondary" className="mt-3 w-full" disabled={status === "locating"} onClick={() => refresh()}>
          <IconMapPin size={18} /> {status === "locating" ? "Finding you…" : "Refresh location"}
        </Button>
      ) : (
        <div className="mt-3">
          <label className="relative block">
            <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="field pl-10" type="search" placeholder="Search for a town or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search for a city" />
          </label>
          {searching && <p className="mt-2 text-[14px] text-muted">Searching…</p>}
          {results && !searching && (
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl bg-card-2">
              {results.length === 0 ? (
                <li className="p-3 text-[15px] text-muted">No places found</li>
              ) : (
                results.map((r) => (
                  <li key={`${r.lat},${r.lon}`}>
                    <button
                      className="press press-subtle flex min-h-12 w-full flex-col justify-center px-3.5 py-2 text-left"
                      onClick={async () => {
                        await saveSettings({ fixedLocation: { lat: r.lat, lon: r.lon, name: r.name } });
                        refresh();
                        setQ("");
                        setResults(null);
                        toast(`📍 Using ${shortName(r.name)}`);
                      }}
                    >
                      <span className="text-[16px] font-medium">{shortName(r.name)}</span>
                      <span className="text-[13px] text-muted">{r.detail}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          {!s.fixedLocation && <p className="mt-2 text-[13px] text-muted">Until you pick a place, your last known location is used ({shortName((last ?? DEFAULT_PLACE).name)}).</p>}
        </div>
      )}
    </Card>
  );
}
