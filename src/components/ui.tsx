"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { categoryColor } from "@/lib/categories";
import { IconClose } from "./Icons";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <section
      className={cx("anim-rise rounded-[var(--radius-card)] bg-card p-4 shadow-card md:p-5", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children, action, icon }: { children: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-8 items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide text-muted">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3 pt-4 md:pt-8">
      <div className="min-w-0">
        {subtitle && <p className="text-[15px] font-medium text-muted">{subtitle}</p>}
        <h1 className="truncate text-[32px] font-bold leading-tight tracking-tight md:text-[36px]">{title}</h1>
      </div>
      {action}
    </header>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
};

export function Button({ variant = "primary", size = "md", className, ...rest }: BtnProps) {
  return (
    <button
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition press disabled:opacity-40",
        size === "lg" && "min-h-[52px] px-6 text-[17px]",
        size === "md" && "min-h-11 px-5 text-[16px]",
        size === "sm" && "min-h-9 px-3.5 text-[14px]",
        variant === "primary" && "bg-accent text-white",
        variant === "secondary" && "bg-accent-soft text-accent",
        variant === "ghost" && "text-accent hover:bg-accent-soft",
        variant === "danger" && "bg-danger-soft text-danger",
        className,
      )}
      {...rest}
    />
  );
}

export function IconButton({ className, label, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-card-2 press press-strong",
        className,
      )}
      {...rest}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-faint">{hint}</span>}
    </label>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cx("flex rounded-xl bg-card-2 p-1", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-10 flex-1 rounded-[10px] px-2 text-[15px] font-medium transition",
            value === o.value ? "bg-card text-text shadow-card" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** iOS-style on/off switch. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors", checked ? "bg-good" : "bg-faint/40")}
    >
      <span
        className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "none" }}
      />
    </button>
  );
}

/** A settings row: label + optional description on the left, a control on the right. */
export function SettingRow({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[16px]">{title}</div>
        {description && <div className="text-[13px] text-muted">{description}</div>}
      </div>
      {children}
    </div>
  );
}

export function CategoryDot({ category, size = 10 }: { category: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: categoryColor(category).dot }}
      aria-hidden
    />
  );
}

export function CategoryChip({ category }: { category: string }) {
  const c = categoryColor(category);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[13px] font-medium" style={{ background: c.soft, color: c.dot }}>
      {category}
    </span>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "warn" | "danger" | "accent" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-medium",
        tone === "muted" && "bg-card-2 text-muted",
        tone === "good" && "bg-good-soft text-good",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "accent" && "bg-accent-soft text-accent",
      )}
    >
      {children}
    </span>
  );
}

/** Round, satisfying checkbox with a pop + ripple when ticked. */
export function Check({
  checked,
  onChange,
  label,
  color = "var(--accent)",
  size = 28,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color?: string;
  size?: number;
}) {
  const [burst, setBurst] = useState(0);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        if (!checked) {
          setBurst((b) => b + 1);
          navigator.vibrate?.(10);
        }
        onChange(!checked);
      }}
      className="relative -m-2 inline-flex shrink-0 items-center justify-center p-2"
    >
      <span
        key={burst}
        className={cx("relative flex items-center justify-center rounded-full border-2 transition-colors", checked && burst > 0 && "anim-pop")}
        style={{
          width: size,
          height: size,
          borderColor: checked ? color : "var(--faint)",
          background: checked ? color : "transparent",
        }}
      >
        {checked && burst > 0 && (
          <span className="anim-ring absolute inset-0 rounded-full" style={{ background: color }} aria-hidden />
        )}
        {checked && (
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16" fill="none" aria-hidden>
            <path className={burst > 0 ? "anim-draw" : undefined} d="M3.5 8.5l3 3 6-7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function Progress({ value, color = "var(--accent)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-card-2", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] spring-smooth" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Empty({ children, emoji }: { children: ReactNode; emoji?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-6 text-center text-[15px] text-muted">
      {emoji && <span className="text-2xl">{emoji}</span>}
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-xl bg-card-2", className)} />;
}

/**
 * Bottom sheet on mobile, centred dialog on desktop.
 * Insertion: .move(edge: .bottom) with .smooth. Removal is asymmetric
 * (quicker), and the last content is kept on screen while it animates out.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [render, setRender] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const last = useRef({ title, children, footer });
  if (open) last.current = { title, children, footer };

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) {
      setRender(true);
      setLeaving(false);
      return;
    }
    if (!render) return;
    setLeaving(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => {
      setRender(false);
      setLeaving(false);
    }, reduce ? 150 : 330);
    return () => clearTimeout(t);
  }, [open, render]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!render || !mounted) return null;
  const c = last.current;
  return createPortal(
    <div
      className={cx("fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6", leaving && "pointer-events-none")}
      role="dialog"
      aria-modal
      aria-label={c.title}
    >
      <div className={cx("absolute inset-0 bg-black/35", leaving ? "anim-fade-out" : "anim-fade")} onClick={onClose} />
      <div
        className={cx(
          "relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-card shadow-float md:max-w-lg md:rounded-[28px]",
          leaving ? "anim-sheet-out" : "anim-sheet",
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line md:hidden" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h2 className="text-[20px] font-bold">{c.title}</h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <IconClose />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{c.children}</div>
        {c.footer && <div className="border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{c.footer}</div>}
        {!c.footer && <div className="pb-safe" />}
      </div>
    </div>,
    document.body,
  );
}

/**
 * SwiftUI's .contentTransition(.numericText()): when the number changes,
 * it rolls in from below (increase) or above (decrease).
 */
export function NumericText({ value, children }: { value: number; children?: ReactNode }) {
  const prev = useRef(value);
  const dir = useRef<"up" | "down" | null>(null);
  if (prev.current !== value) {
    dir.current = value > prev.current ? "up" : "down";
    prev.current = value;
  }
  return (
    <span key={value} className={cx("tabular-nums", dir.current === "up" && "anim-num-up", dir.current === "down" && "anim-num-down")}>
      {children ?? value}
    </span>
  );
}

/** Small celebratory burst — used for gym sessions and finishing all habits. */
export function Confetti({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  const colors = ["#7d7aff", "#3ccf6e", "#f0a640", "#ff6b8b", "#5fafaa"];
  return (
    <span key={trigger} className="pointer-events-none absolute left-1/2 top-1/2 z-10" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 40 + (i % 3) * 18;
        return (
          <span
            key={i}
            className="absolute h-2 w-1.5 rounded-sm"
            style={
              {
                background: colors[i % colors.length],
                animation: "confetti var(--dur-smooth) var(--spring-smooth) forwards",
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist}px`,
                "--rot": `${i * 47}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
