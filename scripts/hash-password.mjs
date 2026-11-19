// Usage: npm run hash-password -- "my secret password"
import { scryptSync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}
if (password.length < 8) console.warn("⚠︎ Consider a password of at least 8 characters.");

const salt = randomBytes(16).toString("base64url");
const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("base64url");
console.log("\nAdd this to your environment variables:\n");
console.log(`AUTH_PASSWORD_HASH=scrypt:${salt}:${hash}\n`);
