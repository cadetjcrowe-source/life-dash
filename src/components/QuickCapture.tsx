"use client";

import { useState } from "react";
import { addInbox } from "@/lib/actions";
import { IconArrowRight, IconInbox } from "./Icons";
import { toast } from "./Toast";
import { cx } from "./ui";

export function QuickCapture({ className }: { className?: string }) {
  const [text, setText] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    addInbox(t);
    setText("");
    toast("Saved to inbox");
  };
  return (
    <form onSubmit={submit} className={cx("anim-rise flex items-center gap-2 rounded-[var(--radius-card)] bg-card p-2 pl-4 shadow-card", className)}>
      <IconInbox size={22} className="shrink-0 text-faint" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Capture a thought or task…"
        className="min-h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint"
        aria-label="Quick capture"
        enterKeyHint="send"
      />
      <button
        disabled={!text.trim()}
        aria-label="Save to inbox"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition press press-strong disabled:bg-card-2 disabled:text-faint"
      >
        <IconArrowRight size={20} />
      </button>
    </form>
  );
}
