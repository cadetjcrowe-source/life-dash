import { randomBytes } from "node:crypto";
import * as webpush from "web-push";
import { bad, handle, ok } from "@/lib/http";
import { vapidKeys } from "@/lib/vapid";

// One-time helper: generates the values to paste into Vercel's environment
// variables. Nothing is stored. If the keys are missing or broken it always
// makes a brand-new matching pair (replace BOTH). Disabled once all is working.
export const POST = handle(async () => {
  const current = vapidKeys();
  if (current.ok && process.env.CRON_SECRET) return bad("Already set up", 403);
  const keys = current.ok ? { publicKey: current.publicKey, privateKey: current.privateKey } : webpush.generateVAPIDKeys();
  return ok({
    VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: current.ok ? "(already set and working – keep it)" : keys.privateKey,
    CRON_SECRET: process.env.CRON_SECRET ? "(already set – keep it)" : randomBytes(32).toString("base64url"),
  });
});
