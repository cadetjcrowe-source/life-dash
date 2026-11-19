import "server-only";
import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  pw: string,
  salt: string,
  len: number,
  opts: { N: number; r: number; p: number },
) => Promise<Buffer>;

/** Verify against AUTH_PASSWORD_HASH (format: scrypt:<salt>:<hash>, base64url). */
export async function verifyPassword(password: string): Promise<boolean> {
  const stored = process.env.AUTH_PASSWORD_HASH ?? "";
  const [algo, salt, hash] = stored.split(":");
  if (algo !== "scrypt" || !salt || !hash) {
    console.error("AUTH_PASSWORD_HASH is missing or malformed");
    return false;
  }
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(password, salt, expected.length, { N: 16384, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
