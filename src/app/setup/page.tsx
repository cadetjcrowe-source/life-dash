import { isConfigured } from "@/lib/password";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 pt-safe pb-safe">
      {isConfigured() ? (
        <div className="anim-rise max-w-sm text-center">
          <p className="mb-2 text-[40px]">✅</p>
          <h1 className="mb-2 text-[24px] font-bold">You're all set up</h1>
          <p className="mb-6 text-muted">Your password is in place.</p>
          <a href="/login" className="press inline-flex min-h-[52px] items-center rounded-full bg-accent px-8 font-semibold text-white">
            Go to sign in
          </a>
        </div>
      ) : (
        <SetupForm />
      )}
    </main>
  );
}
