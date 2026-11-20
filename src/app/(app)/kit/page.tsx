"use client";

import { useState } from "react";
import { IconClose, IconPlus, IconRefresh } from "@/components/Icons";
import { toast } from "@/components/Toast";
import { Button, Card, Check, Confetti, Empty, IconButton, PageHeader, Progress, Skeleton, cx } from "@/components/ui";
import { addKitItem, addKitList, deleteKitItem, deleteKitList, resetKitList, updateKitItem, updateKitList } from "@/lib/actions";
import { useKit } from "@/lib/client";

const EMOJIS = ["🎖️", "🥾", "⛺", "🎒", "🧭", "🏕️", "🚁", "🎯", "🏅", "🧥"];

export default function KitPage() {
  const { data } = useKit();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [burst, setBurst] = useState(0);

  const lists = data?.lists ?? [];
  const list = lists.find((l) => l.id === selected) ?? lists[0];
  const items = (data?.items ?? []).filter((i) => i.listId === list?.id);
  const packed = items.filter((i) => i.checked).length;

  const tick = (id: string, v: boolean) => {
    updateKitItem(id, { checked: v });
    if (v && packed + 1 === items.length && items.length > 0) {
      setBurst((b) => b + 1);
      toast("All packed! 🎖️");
    }
  };

  return (
    <>
      <PageHeader
        title="Kit lists"
        subtitle="Reusable packing checklists"
        action={
          <Button variant={editing ? "primary" : "secondary"} onClick={() => setEditing((e) => !e)} className="mb-1">
            {editing ? "Done" : "Edit"}
          </Button>
        }
      />

      {!data ? (
        <Card>
          <Skeleton className="h-60" />
        </Card>
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {lists.map((l) => {
              const its = data.items.filter((i) => i.listId === l.id);
              const done = its.length > 0 && its.every((i) => i.checked);
              return (
                <button
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                  className={cx(
                    "press flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-[16px] font-medium",
                    l.id === list?.id ? "bg-accent text-white" : "bg-card shadow-card",
                  )}
                >
                  <span className="text-[20px]">{l.emoji}</span>
                  {l.name}
                  {done && <span>✓</span>}
                </button>
              );
            })}
            {editing && (
              <button
                onClick={() => {
                  const name = prompt("Name of the new list (e.g. Expedition)");
                  if (name?.trim()) addKitList(name.trim());
                }}
                className="press flex min-h-12 shrink-0 items-center gap-1.5 rounded-2xl border-2 border-dashed border-line px-4 text-[16px] font-medium text-accent"
              >
                <IconPlus size={18} /> New list
              </button>
            )}
          </div>

          {!list ? (
            <Card>
              <Empty emoji="🎒">No kit lists yet. Tap Edit, then New list.</Empty>
            </Card>
          ) : (
            <Card className="mx-auto max-w-2xl">
              {editing ? (
                <div className="mb-4 space-y-3">
                  <input key={list.id} className="field text-[18px] font-semibold" defaultValue={list.name} onBlur={(e) => e.target.value.trim() && e.target.value !== list.name && updateKitList(list.id, { name: e.target.value.trim() })} aria-label="List name" />
                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => updateKitList(list.id, { emoji: e })}
                        className={cx("press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[22px]", list.emoji === e ? "bg-accent-soft ring-2 ring-accent" : "bg-card-2")}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[22px] font-bold">
                      {list.emoji} {list.name}
                    </h2>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        resetKitList(list.id);
                        toast("List reset");
                      }}
                      disabled={packed === 0}
                    >
                      <IconRefresh size={16} /> Reset
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={items.length ? (packed / items.length) * 100 : 0} color="var(--good)" className="flex-1" />
                    <span className="text-[14px] font-semibold tabular-nums text-muted">
                      {packed}/{items.length} packed
                    </span>
                  </div>
                  <Confetti trigger={burst} />
                </div>
              )}

              <ul className="divide-y divide-line">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2.5">
                    {editing ? (
                      <>
                        <input className="field !min-h-11 flex-1 !py-2" defaultValue={i.text} onBlur={(e) => e.target.value.trim() && e.target.value !== i.text && updateKitItem(i.id, { text: e.target.value.trim() })} />
                        <IconButton label={`Remove ${i.text}`} onClick={() => deleteKitItem(i.id)} className="text-faint">
                          <IconClose size={18} />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Check checked={i.checked} onChange={(v) => tick(i.id, v)} label={i.text} color="var(--good)" />
                        <button onClick={() => tick(i.id, !i.checked)} className={cx("flex-1 text-left text-[17px] transition-colors", i.checked && "text-muted line-through")}>
                          {i.text}
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newItem.trim()) return;
                  addKitItem(list.id, newItem.trim());
                  setNewItem("");
                }}
              >
                <input className="field" placeholder="Add an item…" value={newItem} onChange={(e) => setNewItem(e.target.value)} enterKeyHint="done" />
                <Button type="submit" variant="secondary" disabled={!newItem.trim()} aria-label="Add item">
                  <IconPlus size={20} />
                </Button>
              </form>

              {editing && (
                <Button
                  variant="danger"
                  className="mt-4 w-full"
                  onClick={() => {
                    if (confirm(`Delete the "${list.name}" list?`)) {
                      deleteKitList(list.id);
                      setSelected(null);
                    }
                  }}
                >
                  Delete this list
                </Button>
              )}
            </Card>
          )}
        </>
      )}
    </>
  );
}
