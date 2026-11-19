"use client";

import { useState } from "react";

type Result = { AUTH_PASSWORD_HASH: string; SESSION_SECRET: string };

function CopyRow({ name, value }: { name: string; value: string }) {
  const [copied, setCopied] = useState<"name" | "value" | null>(null);
  const copy = async (what: "name" | "value") => {
    await navigator.clipboard.writeText(what === "name" ? name : value);
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">Key</span>
        <button onClick={() => copy("name")} className="press min-h-9 rounded-full bg-accent-soft px-3 text-[14px] font-semibold text-accent">
          {copied === "name" ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <code className="block font-mono text-[15px] font-semibold">{name}</code>
      <div className="mb-1 mt-3 flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-muted">Value</span>
        <button onClick={() => copy("value")} className="press min-h-9 rounded-full bg-accent px-3 text-[14px] font-semibold text-white">
          {copied === "value" ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <code className="block break-all rounded-lg bg-card-2 p-2 font-mono text-[13px]">{value}</code>
    </div>
  );
}

export function SetupForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await res.json().catch(() => null);
    if (!res.ok) return setError(data?.error ?? "Something went wrong.");
    setResult(data);
    setPassword("");
    setConfirm("");
  }

  if (result)
    return (
      <div className="anim-rise w-full max-w-md py-8">
        <h1 className="mb-2 text-[26px] font-bold tracking-tight">Nearly there!</h1>
        <p className="mb-5 text-muted">
          In Vercel, go to your project → <b className="text-text">Settings</b> → <b className="text-text">Environment Variables</b>. Add these two, one at a time: copy the key into the Key box and the value into the Value box,
          then press <b className="text-text">Save</b>.
        </p>
        <div className="space-y-3">
          <CopyRow name="AUTH_PASSWORD_HASH" value={result.AUTH_PASSWORD_HASH} />
          <CopyRow name="SESSION_SECRET" value={result.SESSION_SECRET} />
        </div>
        <p className="mt-5 text-[15px] text-muted">
          Then go to <b className="text-text">Deployments</b>, tap the <b className="text-text">⋯</b> next to the top one, and choose <b className="text-text">Redeploy</b>. After a minute or two, sign in with the password you just
          chose. These codes don't contain your password, so they're safe to paste.
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="anim-rise w-full max-w-sm">
      <img src="/icons/icon-192.png" alt="" className="mx-auto mb-5 h-20 w-20 rounded-[22px] shadow-float" />
      <h1 className="mb-1 text-center text-[26px] font-bold tracking-tight">Set up Life</h1>
      <p className="mb-7 text-center text-muted">Choose the password you'll use to sign in.</p>
      <input type="password" autoComplete="new-password" placeholder="New password" className="field mb-3" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="password" autoComplete="new-password" placeholder="Type it again" className="field mb-3" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && <p className="mb-3 text-center text-[15px] text-danger">{error}</p>}
      <button disabled={!password || !confirm} className="press min-h-[52px] w-full rounded-full bg-accent text-[17px] font-semibold text-white disabled:opacity-40">
        Continue
      </button>
    </form>
  );
}
