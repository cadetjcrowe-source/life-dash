import { randomBytes } from "node:crypto";
import * as webpush from "web-push";
import { bad, handle, ok } from "@/lib/http";
import { pushConfigured } from "@/lib/push";

// One-time helper: generates the values to paste into Vercel's environment
// variables. Nothing is stored. Disabled once push is configured.
export const POST = handle(async () => {
  if (pushConfigured() && process.env.CRON_SECRET) return bad("Already set up", 403);
  const keys = webpush.generateVAPIDKeys();
  return ok({
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ?? keys.publicKey,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? "(already set – keep it)" : keys.privateKey,
    CRON_SECRET: process.env.CRON_SECRET ? "(already set – keep it)" : randomBytes(32).toString("base64url"),
  });
});
