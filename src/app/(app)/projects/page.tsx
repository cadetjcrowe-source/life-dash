"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/db/schema";
import { IconArchive, IconChevronDown, IconChevronUp, IconPlus } from "@/components/Icons";
import { Button, Card, CategoryChip, Empty, Field, IconButton, PageHeader, Pill, Progress, Sheet, Skeleton, cx } from "@/components/ui";
import { addProject, deleteProject, reorderProjects, updateProject, type ProjectDraft } from "@/lib/actions";
import { useProjects } from "@/lib/client";
import { PROJECT_STATUSES } from "@/lib/constants";
import { categoryColor, useCategoryNames } from "@/lib/categories";

const statusTone = (s: string) =>
  s === "active" ? "accent" : s === "done" ? "good" : s === "blocked" ? "danger" : s === "paused" ? "warn" : "muted";

export default function ProjectsPage() {
  const { data: projects } = useProjects();
  const [edit, setEdit] = useState<Project | null | undefined>(undefined);
  const [reorder, setReorder] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const active = useMemo(() => (projects ?? []).filter((p) => !p.archived).sort((a, b) => a.sortOrder - b.sortOrder), [projects]);
  const archived = (projects ?? []).filter((p) => p.archived);

  const move = (i: number, dir: -1 | 1) => {
    const ids = active.map((p) => p.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorderProjects(ids);
  };

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={projects ? `${active.filter((p) => p.status === "active").length} active` : " "}
        action={
          <div className="mb-1 flex gap-2">
            <Button variant={reorder ? "primary" : "secondary"} onClick={() => setReorder((r) => !r)}>
              {reorder ? "Done" : "Reorder"}
            </Button>
            {!reorder && (
              <Button onClick={() => setEdit(null)} aria-label="New project">
                <IconPlus size={20} />
              </Button>
            )}
          </div>
        }
      />

      {!projects ? (
        <Card>
          <Skeleton className="h-40" />
        </Card>
      ) : active.length === 0 ? (
        <Card>
          <Empty emoji="🚀">No projects yet</Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((p, i) => (
            <ProjectCard key={p.id} p={p} delay={i * 40} onEdit={() => setEdit(p)}>
              {reorder && (
                <div className="flex shrink-0 flex-col">
                  <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-20">
                    <IconChevronUp />
                  </IconButton>
                  <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === active.length - 1} className="disabled:opacity-20">
                    <IconChevronDown />
                  </IconButton>
                </div>
              )}
            </ProjectCard>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowArchived((v) => !v)} className="mb-3 flex min-h-11 items-center gap-2 text-[15px] font-semibold uppercase tracking-wide text-muted">
            <IconArchive size={18} /> Archived ({archived.length}) <span className="font-normal normal-case text-accent">{showArchived ? "Hide" : "Show"}</span>
          </button>
          {showArchived && (
            <div className="grid grid-cols-1 gap-4 opacity-70 md:grid-cols-2 xl:grid-cols-3">
              {archived.map((p) => (
                <ProjectCard key={p.id} p={p} onEdit={() => setEdit(p)} />
              ))}
            </div>
          )}
        </div>
      )}

      <ProjectSheet open={edit !== undefined} project={edit} onClose={() => setEdit(undefined)} />
    </>
  );
}

function ProjectCard({ p, onEdit, delay, children }: { p: Project; onEdit: () => void; delay?: number; children?: React.ReactNode }) {
  const color = categoryColor(p.category).dot;
  return (
    <Card delay={delay} className="flex gap-2">
      <button onClick={onEdit} className="press press-subtle min-w-0 flex-1 text-left">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[26px]" style={{ background: categoryColor(p.category).soft }}>
            {p.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] font-semibold leading-snug">{p.name}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Pill tone={statusTone(p.status)}>{PROJECT_STATUSES.find((s) => s.value === p.status)?.label}</Pill>
              <CategoryChip category={p.category} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={p.progress} color={color} className="flex-1" />
          <span className="w-10 text-right text-[14px] font-semibold tabular-nums text-muted">{p.progress}%</span>
        </div>
        {p.nextAction && (
          <p className="mt-3 text-[15px]">
            <span className="font-semibold text-accent">Next → </span>
            {p.nextAction}
          </p>
        )}
        {p.notes && <p className="mt-2 line-clamp-2 whitespace-pre-line text-[14px] text-muted">{p.notes}</p>}
      </button>
      {children}
    </Card>
  );
}

const EMOJIS = ["📁", "🏰", "🌉", "🎧", "🎬", "🛩️", "💼", "🎮", "📷", "🎵", "🎖️", "📚", "💡", "🚀"];

function ProjectSheet({ open, project, onClose }: { open: boolean; project?: Project | null; onClose: () => void }) {
  const blank: ProjectDraft = { name: "", emoji: "📁", category: "Personal", status: "active", progress: 0, nextAction: "", notes: "" };
  const [d, setD] = useState<ProjectDraft>(blank);
  const CATEGORY_NAMES = useCategoryNames();
  useEffect(() => {
    if (open) setD(project ? { ...project } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project]);
  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => setD((s) => ({ ...s, [k]: v }));

  const save = () => {
    if (!d.name?.trim()) return;
    const payload = {
      name: d.name.trim(),
      emoji: d.emoji,
      category: d.category,
      status: d.status,
      progress: d.progress,
      nextAction: d.nextAction,
      notes: d.notes,
    };
    if (project) updateProject(project.id, payload);
    else addProject(payload as ProjectDraft & { name: string });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={project ? "Edit project" : "New project"}
      footer={
        <div className="space-y-2">
          <Button size="lg" className="w-full" onClick={save} disabled={!d.name?.trim()}>
            {project ? "Save" : "Add project"}
          </Button>
          {project && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  updateProject(project.id, { archived: !project.archived });
                  onClose();
                }}
              >
                {project.archived ? "Unarchive" : "Archive"}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  if (confirm(`Delete "${project.name}" for good?`)) {
                    deleteProject(project.id);
                    onClose();
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <input className="field text-[18px] font-medium" placeholder="Project name" value={d.name ?? ""} onChange={(e) => set("name", e.target.value)} autoFocus={!project} />
        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => set("emoji", e)}
              className={cx("press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[22px]", d.emoji === e ? "bg-accent-soft ring-2 ring-accent" : "bg-card-2")}
            >
              {e}
            </button>
          ))}
        </div>
        <Field label={`Progress — ${d.progress ?? 0}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={d.progress ?? 0}
            onChange={(e) => set("progress", Number(e.target.value))}
            className="h-11 w-full accent-[var(--accent)]"
          />
        </Field>
        <Field label="Status">
          <div className="flex flex-wrap gap-2">
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => set("status", s.value)}
                className={cx("press min-h-10 rounded-full px-4 text-[15px] font-medium", d.status === s.value ? "bg-accent text-white" : "bg-card-2")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Category">
          <select className="field" value={d.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORY_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Next action">
          <input className="field" placeholder="The very next step" value={d.nextAction ?? ""} onChange={(e) => set("nextAction", e.target.value)} />
        </Field>
        <Field label="Notes">
          <textarea className="field min-h-28" value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}
