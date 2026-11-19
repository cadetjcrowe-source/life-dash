"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShotIdea } from "@/db/schema";
import { IconLink, IconMapPin, IconPlus } from "@/components/Icons";
import { Button, Card, Check, Empty, Field, PageHeader, Pill, Sheet, Skeleton, cx } from "@/components/ui";
import { addShot, deleteShot, saveSettings, updateShot, type ShotDraft } from "@/lib/actions";
import { useSettings, useShots } from "@/lib/client";
import { DEFAULT_SETTINGS, SHOT_TIMES } from "@/lib/constants";
import { formatShort } from "@/lib/dates";

const timeMeta = (v: string) => SHOT_TIMES.find((t) => t.value === v) ?? SHOT_TIMES[SHOT_TIMES.length - 1];

export default function ShotsPage() {
  const { data: shots } = useShots();
  const [tag, setTag] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [showShot, setShowShot] = useState(false);
  const [edit, setEdit] = useState<ShotIdea | null | undefined>(undefined);

  const tags = useMemo(() => [...new Set((shots ?? []).flatMap((s) => s.tags))].sort(), [shots]);
  const places = useMemo(() => [...new Set((shots ?? []).map((s) => s.location.trim()).filter(Boolean))].sort(), [shots]);
  const filtered = (shots ?? []).filter(
    (s) => (!tag || s.tags.includes(tag)) && (!place || s.location.trim() === place) && (showShot ? s.shot : !s.shot),
  );
  const shotCount = (shots ?? []).filter((s) => s.shot).length;

  return (
    <>
      <PageHeader
        title="Shot ideas"
        subtitle={shots ? `${(shots ?? []).length - shotCount} to shoot · ${shotCount} done` : " "}
        action={
          <Button onClick={() => setEdit(null)} className="mb-1">
            <IconPlus size={20} /> Idea
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-card-2 p-1">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              onClick={() => setShowShot(v)}
              className={cx("min-h-10 rounded-[10px] px-4 text-[15px] font-medium transition", showShot === v ? "bg-card shadow-card" : "text-muted")}
            >
              {v ? "Shot ✓" : "To shoot"}
            </button>
          ))}
        </div>
        {places.length > 0 && (
          <select className="field !min-h-11 !w-auto !py-2" value={place} onChange={(e) => setPlace(e.target.value)} aria-label="Filter by location">
            <option value="">📍 Any location</option>
            {places.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        )}
      </div>
      {tags.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {[null, ...tags].map((t) => (
            <button
              key={t ?? "all"}
              onClick={() => setTag(t)}
              className={cx("press min-h-10 shrink-0 rounded-full px-4 text-[15px] font-medium", tag === t ? "bg-text text-bg" : "bg-card shadow-card")}
            >
              {t ? `#${t}` : "All tags"}
            </button>
          ))}
        </div>
      )}

      {!shots ? (
        <Card>
          <Skeleton className="h-40" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty emoji={showShot ? "🎞️" : "📸"}>
            {showShot ? "Nothing marked as shot yet." : shots.length ? "No ideas match these filters." : "Save your first photo or video idea."}
          </Empty>
        </Card>
      ) : (
        <div className="gap-4 md:columns-2 xl:columns-3">
          {filtered.map((s, i) => (
            <div key={s.id} className="mb-4 break-inside-avoid">
              <ShotCard shot={s} delay={Math.min(i, 8) * 40} onEdit={() => setEdit(s)} />
            </div>
          ))}
        </div>
      )}

      <ShotSheet open={edit !== undefined} shot={edit} onClose={() => setEdit(undefined)} knownTags={tags} />
    </>
  );
}

function ShotCard({ shot, onEdit, delay }: { shot: ShotIdea; onEdit: () => void; delay: number }) {
  const t = timeMeta(shot.bestTime);
  const [imgOk, setImgOk] = useState(true);
  return (
    <Card delay={delay} className={cx("overflow-hidden !p-0", shot.shot && "opacity-70")}>
      {shot.imageUrl && imgOk && (
        <button onClick={onEdit} className="block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setImgOk(false)} className="max-h-64 w-full object-cover" />
        </button>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={onEdit} className="min-w-0 flex-1 text-left">
            <h3 className={cx("text-[18px] font-semibold leading-snug", shot.shot && "line-through decoration-2")}>{shot.title}</h3>
          </button>
          <Check checked={shot.shot} onChange={(v) => updateShot(shot.id, { shot: v })} label={`Mark ${shot.title} as shot`} color="var(--good)" />
        </div>
        {shot.description && <p className="mt-1 line-clamp-3 whitespace-pre-line text-[15px] text-muted">{shot.description}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill tone="warn">
            {t.emoji} {t.label}
          </Pill>
          {shot.location && (
            <Pill>
              <IconMapPin size={13} /> {shot.location}
            </Pill>
          )}
          {shot.tags.map((tg) => (
            <Pill key={tg} tone="accent">
              #{tg}
            </Pill>
          ))}
        </div>
        {(shot.link || shot.shotOn) && (
          <div className="mt-3 flex items-center justify-between gap-2 text-[14px]">
            {shot.link ? (
              <a href={shot.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 font-medium text-accent">
                <IconLink size={16} /> Inspiration
              </a>
            ) : (
              <span />
            )}
            {shot.shotOn && <span className="text-good">✓ Shot {formatShort(shot.shotOn)}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

function ShotSheet({ open, shot, onClose, knownTags }: { open: boolean; shot?: ShotIdea | null; onClose: () => void; knownTags: string[] }) {
  const { data: settings } = useSettings();
  const suggested = [...new Set([...(settings ?? DEFAULT_SETTINGS).shotTags, ...knownTags])];
  const blank: ShotDraft = { title: "", description: "", location: "", bestTime: "golden-evening", link: "", imageUrl: "", tags: [] };
  const [d, setD] = useState<ShotDraft>(blank);
  const [newTag, setNewTag] = useState("");
  useEffect(() => {
    if (open) setD(shot ? { ...shot } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shot]);
  const set = <K extends keyof ShotDraft>(k: K, v: ShotDraft[K]) => setD((s) => ({ ...s, [k]: v }));
  const toggleTag = (t: string) => set("tags", d.tags?.includes(t) ? d.tags.filter((x) => x !== t) : [...(d.tags ?? []), t]);
  const urlOk = (u?: string) => !u || /^https?:\/\/\S+$/i.test(u);

  const save = () => {
    if (!d.title.trim() || !urlOk(d.link) || !urlOk(d.imageUrl)) return;
    const payload: ShotDraft = { ...d, title: d.title.trim(), link: d.link?.trim(), imageUrl: d.imageUrl?.trim(), location: d.location?.trim() };
    const { id: _i, shot: _s, shotOn: _o, createdAt: _c, updatedAt: _u, ...clean } = payload as ShotIdea;
    if (shot) updateShot(shot.id, clean);
    else addShot(clean);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={shot ? "Edit idea" : "New shot idea"}
      footer={
        <div className="flex gap-2">
          {shot && (
            <Button
              variant="danger"
              onClick={() => {
                deleteShot(shot.id);
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={save} disabled={!d.title.trim() || !urlOk(d.link) || !urlOk(d.imageUrl)}>
            {shot ? "Save" : "Add idea"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <input className="field text-[18px] font-medium" placeholder="e.g. Drone shot of Ramsey harbour at sunset" value={d.title} onChange={(e) => set("title", e.target.value)} autoFocus={!shot} />
        <Field label="Description">
          <textarea className="field min-h-20" placeholder="Angle, lens, mood, gear…" value={d.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Location">
          <input className="field" placeholder="e.g. Mooragh Park" value={d.location ?? ""} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Best time of day">
          <div className="grid grid-cols-2 gap-2">
            {SHOT_TIMES.map((t) => (
              <button
                key={t.value}
                onClick={() => set("bestTime", t.value)}
                className={cx("press min-h-11 rounded-xl px-3 text-left text-[15px] font-medium", d.bestTime === t.value ? "bg-accent text-white" : "bg-card-2")}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Tags">
          <div className="flex flex-wrap gap-2">
            {[...new Set([...suggested, ...(d.tags ?? [])])].map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={cx("press min-h-10 rounded-full px-3.5 text-[15px] font-medium", d.tags?.includes(t) ? "bg-accent text-white" : "bg-card-2")}
              >
                #{t}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const t = newTag.trim().replace(/^#/, "");
              if (!t) return;
              if (!d.tags?.includes(t)) set("tags", [...(d.tags ?? []), t]);
              if (!suggested.includes(t)) saveSettings({ shotTags: [...(settings ?? DEFAULT_SETTINGS).shotTags, t] });
              setNewTag("");
            }}
          >
            <input className="field" placeholder="New tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            <Button variant="secondary" type="submit" disabled={!newTag.trim()}>
              Add
            </Button>
          </form>
        </Field>
        <Field label="Inspiration link" hint={urlOk(d.link) ? "Instagram, YouTube, Pinterest…" : "That doesn't look like a web address (start with https://)"}>
          <input className="field" type="url" inputMode="url" placeholder="https://" value={d.link ?? ""} onChange={(e) => set("link", e.target.value)} />
        </Field>
        <Field label="Inspiration image URL" hint={urlOk(d.imageUrl) ? "Long-press an image online → Copy Image Address, then paste here" : "That doesn't look like a web address"}>
          <input className="field" type="url" inputMode="url" placeholder="https://…/photo.jpg" value={d.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} />
        </Field>
        {d.imageUrl && urlOk(d.imageUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.imageUrl} alt="Preview" referrerPolicy="no-referrer" className="max-h-48 w-full rounded-xl object-cover" />
        )}
      </div>
    </Sheet>
  );
}
