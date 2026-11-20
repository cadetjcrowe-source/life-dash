"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OWNER_NAME } from "@/lib/profile";

function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const next = params.get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else {
      setBusy(false);
      if (res.status === 503) {
        window.location.href = "/setup";
        return;
      }
      setError(res.status === 401 ? "That password isn't right." : "Couldn't sign in — check the server settings.");
    }
  }

  return (
    <form onSubmit={submit} className="anim-rise w-full max-w-sm">
      <img src="/icons/icon-192.png" alt="" className="mx-auto mb-5 h-20 w-20 rounded-[22px] shadow-float" />
      <h1 className="mb-1 text-center text-[28px] font-bold tracking-tight">Life</h1>
      <p className="mb-8 text-center text-muted">Welcome back, {OWNER_NAME}</p>
      <input
        type="password"
        autoComplete="current-password"
        autoFocus
        placeholder="Password"
        className="field mb-3 text-center"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="Password"
      />
      {error && <p className="mb-3 text-center text-[15px] text-danger">{error}</p>}
      <button
        disabled={busy || !password}
        className="min-h-[52px] w-full rounded-full bg-accent text-[17px] font-semibold text-white transition press disabled:opacity-40"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-4 text-center text-[13px] text-faint">You'll stay signed in for 30 days on this device.</p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 pt-safe pb-safe">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
