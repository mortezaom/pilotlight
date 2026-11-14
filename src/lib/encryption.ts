import { env } from "cloudflare:workers";
import { timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

// sessions survive a week; logout bumps the admin's sessionVersion to revoke them
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function secret(name: "SESSION_SECRET" | "ENCRYPTION_KEY") {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

// PBKDF2 via WebCrypto (native code). bcryptjs took ~65ms CPU per login and
// 100k iterations ~18ms, both over the Workers Free plan's 10ms; 25k is ~4ms.
// shortcut: weaker than OWASP's 600k, raise it (max 100k in workerd) on Workers
// Paid. The count is stored in each hash, so existing logins keep working.
const PASSWORD_ITERATIONS = 25_000;

async function pbkdf2(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { hash: "SHA-256", iterations, name: "PBKDF2", salt },
    material,
    256
  );
  return Buffer.from(bits);
}

const safeEqual = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && timingSafeEqual(a, b);

/** Constant-time string comparison (for secrets) */
export const safeEqualText = (a: string, b: string) =>
  safeEqual(Buffer.from(a), Buffer.from(b));

/** Returns "pbkdf2-sha256$<iterations>$<salt>$<hash>" with base64 parts */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PASSWORD_ITERATIONS);
  return [
    "pbkdf2-sha256",
    PASSWORD_ITERATIONS,
    Buffer.from(salt).toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

export async function comparePassword(password: string, stored: string) {
  const [scheme, iterations, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || !(iterations && salt && hash)) {
    return false;
  }
  const actual = await pbkdf2(
    password,
    new Uint8Array(Buffer.from(salt, "base64")),
    Number(iterations)
  );
  return safeEqual(actual, Buffer.from(hash, "base64"));
}

export type Session = { email: string; v: number };

const sessionKey = () => new TextEncoder().encode(secret("SESSION_SECRET"));

export const signSession = (session: Session) =>
  new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionKey());

export async function verifySession(token?: string) {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify<Session>(token, sessionKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

const IV_BYTES = 12;
const credentialKeys = new Map<string, Promise<CryptoKey>>();

// The key is high-entropy, so a fast HKDF is enough (no per-item salt or
// PBKDF2): one cheap derivation per isolate instead of one per channel.
function credentialKey() {
  const raw = secret("ENCRYPTION_KEY");
  let key = credentialKeys.get(raw);
  if (!key) {
    key = crypto.subtle
      .importKey("raw", new TextEncoder().encode(raw), "HKDF", false, [
        "deriveKey",
      ])
      .then((material) =>
        crypto.subtle.deriveKey(
          {
            hash: "SHA-256",
            info: new TextEncoder().encode(
              "pilotlight/notification-credentials"
            ),
            name: "HKDF",
            salt: new Uint8Array(),
          },
          material,
          { length: 256, name: "AES-GCM" },
          false,
          ["encrypt", "decrypt"]
        )
      );
    credentialKeys.set(raw, key);
  }
  return key;
}

/** AES-GCM encrypt; output is base64(iv + ciphertext) */
export async function encrypt(data: string) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encrypted = await crypto.subtle.encrypt(
    { iv, name: "AES-GCM" },
    await credentialKey(),
    new TextEncoder().encode(data)
  );
  return Buffer.concat([iv, new Uint8Array(encrypted)]).toString("base64");
}

export async function decrypt(encoded: string) {
  const bytes = new Uint8Array(Buffer.from(encoded, "base64"));
  const decrypted = await crypto.subtle.decrypt(
    { iv: bytes.slice(0, IV_BYTES), name: "AES-GCM" },
    await credentialKey(),
    bytes.slice(IV_BYTES)
  );
  return new TextDecoder().decode(decrypted);
}
