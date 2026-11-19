import "server-only";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

/** Wrap a handler so validation and DB errors become JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ZodError) return bad(err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
      console.error(err);
      return bad("Something went wrong", 500);
    }
  };
}

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  const json = await req.json().catch(() => ({}));
  return schema.parse(json);
}

export const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
export const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:MM");
export const uuid = z.uuid();

export type Ctx<P extends string = "id"> = { params: Promise<Record<P, string>> };
