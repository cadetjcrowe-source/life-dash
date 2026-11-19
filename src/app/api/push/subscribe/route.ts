import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { body, handle, ok } from "@/lib/http";
import { pushConfigured } from "@/lib/push";

const sub = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2000),
  keys: z.object({ p256dh: z.string().min(10).max(500), auth: z.string().min(4).max(200) }),
});

// GET: is push set up, the public key for subscribing, and how many devices are registered.
export const GET = handle(async () => {
  const devices = pushConfigured() ? (await db().select({ id: schema.pushSubscriptions.id }).from(schema.pushSubscriptions)).length : 0;
  return ok({ configured: pushConfigured(), publicKey: process.env.VAPID_PUBLIC_KEY ?? null, devices });
});

export const POST = handle(async (req: Request) => {
  const s = await body(req, sub);
  const values = { endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300) };
  await db()
    .insert(schema.pushSubscriptions)
    .values(values)
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { p256dh: values.p256dh, auth: values.auth } });
  return ok({ ok: true }, { status: 201 });
});

export const DELETE = handle(async (req: Request) => {
  const { endpoint } = await body(req, z.object({ endpoint: z.url({ protocol: /^https$/ }).max(2000) }));
  await db().delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, endpoint));
  return ok({ ok: true });
});
