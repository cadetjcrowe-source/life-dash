import { randomBytes } from "node:crypto";
import { z } from "zod";
import { bad, body, handle, ok } from "@/lib/http";
import { hashPassword, isConfigured } from "@/lib/password";

// First-time setup helper: turns a password into the env values to paste into Vercel.
// Nothing is stored. Once the app is configured this endpoint switches itself off.
export const POST = handle(async (req: Request) => {
  if (isConfigured()) return bad("Already set up", 403);
  const { password } = await body(req, z.object({ password: z.string().min(8, "Use at least 8 characters").max(200) }));
  return ok({
    AUTH_PASSWORD_HASH: await hashPassword(password),
    SESSION_SECRET: randomBytes(48).toString("base64url"),
  });
});
