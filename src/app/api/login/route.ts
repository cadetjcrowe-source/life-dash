import { cookies } from "next/headers";
import { z } from "zod";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { bad, body, handle, ok } from "@/lib/http";

export const POST = handle(async (req: Request) => {
  const { password } = await body(req, z.object({ password: z.string().min(1).max(200) }));
  if (!(await verifyPassword(password))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return bad("Wrong password", 401);
  }
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
  return ok({ ok: true });
});
