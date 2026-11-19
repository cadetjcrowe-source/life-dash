import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  pw: string,
  salt: string,
  len: number,
  opts: { N: number; r: number; p: number },
) => Promise<Buffer>;

export const isConfigured = () =>
  (process.env.AUTH_PASSWORD_HASH ?? "").startsWith("scrypt:") && (process.env.SESSION_SECRET ?? "").length >= 32;

/** Create the AUTH_PASSWORD_HASH value for a password (same format as scripts/hash-password.mjs). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt:${salt}:${hash.toString("base64url")}`;
}

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
