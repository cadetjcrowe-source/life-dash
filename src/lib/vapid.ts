import "server-only";
import { createECDH } from "node:crypto";

// Web Push (VAPID) keys come from environment variables pasted by hand, so
// check them carefully: tidy stray quotes/spaces, fix keys pasted into each
// other's boxes, and make sure the two keys actually belong together.

export type VapidProblem = "missing" | "invalid" | "mismatch";
export type VapidResult = { ok: true; publicKey: string; privateKey: string; swapped: boolean } | { ok: false; problem: VapidProblem };

const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["'\s]+|["'\s]+$/g, "").replace(/\s+/g, "");
const decode = (v: string) => {
  try {
    return Buffer.from(v.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "base64url");
  } catch {
    return Buffer.alloc(0);
  }
};
const isPublic = (b: Buffer) => b.length === 65 && b[0] === 4;
const isPrivate = (b: Buffer) => b.length === 32;

export function vapidKeys(): VapidResult {
  let pub = decode(clean(process.env.VAPID_PUBLIC_KEY));
  let priv = decode(clean(process.env.VAPID_PRIVATE_KEY));
  if (!pub.length && !priv.length) return { ok: false, problem: "missing" };
  let swapped = false;
  if (isPrivate(pub) && isPublic(priv)) {
    [pub, priv] = [priv, pub];
    swapped = true;
  }
  if (!isPublic(pub) || !isPrivate(priv)) return { ok: false, problem: "invalid" };
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(priv);
    if (!ecdh.getPublicKey().equals(pub)) return { ok: false, problem: "mismatch" };
  } catch {
    return { ok: false, problem: "invalid" };
  }
  return { ok: true, publicKey: pub.toString("base64url"), privateKey: priv.toString("base64url"), swapped };
}
