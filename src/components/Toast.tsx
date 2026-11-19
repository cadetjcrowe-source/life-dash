"use client";

import { useEffect, useState } from "react";

type T = { id: number; text: string; leaving?: boolean };
let listeners: ((t: T) => void)[] = [];
let n = 0;

export function toast(text: string) {
  const t = { id: ++n, text };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const l = (t: T) => {
      setItems((s) => [...s, t]);
      setTimeout(() => setItems((s) => s.map((x) => (x.id === t.id ? { ...x, leaving: true } : x))), 2800);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 3300);
    };
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 pt-safe" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`${t.leaving ? "anim-toast-out" : "anim-toast"} mt-3 rounded-full bg-text px-5 py-3 text-[15px] font-medium text-bg shadow-float`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
