/**
 * Storage for share blobs. Server-only: the `.server` suffix and the absence
 * of any import from a client component are what keep it that way.
 *
 * Expiry is the datastore's job: every share is written with a TTL, so links
 * die on their own and there is no sweeper to write, schedule or forget. The
 * stored value is ciphertext plus an IV and nothing else — no IP, no user
 * agent, no referrer, nothing that would let this become a log of who shared
 * what.
 *
 * Backed by Redis over HTTP (Upstash, or Vercel's KV integration, which sets
 * the same variables under a different prefix). Without credentials it falls
 * back to an in-process map so local development works; that fallback is
 * per-instance and lost on restart, which is fine for a dev machine and
 * useless in production — see `isPersistent`.
 */

export interface ShareRecord {
  ciphertext: string;
  iv: string;
}

const url =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";

/** False when running on the in-memory fallback. */
export const isPersistent = Boolean(url && token);

async function redis(command: (string | number)[]): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Share store error: ${response.status}`);
  }
  const body = (await response.json()) as { result?: unknown };
  return body.result;
}

// ---- In-memory fallback (development only) ----

const memory = new Map<string, { value: string; expiresAt: number }>();

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number) {
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ---- Public API ----

const shareKey = (id: string) => `share:${id}`;

export async function putShare(
  id: string,
  record: ShareRecord,
  ttlSeconds: number,
): Promise<void> {
  const value = JSON.stringify(record);
  if (isPersistent) {
    await redis(["SET", shareKey(id), value, "EX", ttlSeconds]);
    return;
  }
  memorySet(shareKey(id), value, ttlSeconds);
}

export async function getShare(id: string): Promise<ShareRecord | null> {
  const raw = isPersistent
    ? ((await redis(["GET", shareKey(id)])) as string | null)
    : memoryGet(shareKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShareRecord;
  } catch {
    return null;
  }
}

/**
 * Fixed-window counter. Returns false once the caller is over the limit.
 *
 * The key is a hash of the client address, held only for the length of the
 * window, so it cannot be joined back to any share.
 */
export async function withinRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const key = `rate:${bucket}`;
  if (isPersistent) {
    const count = Number(await redis(["INCR", key]));
    if (count === 1) await redis(["EXPIRE", key, windowSeconds]);
    return count <= limit;
  }
  const current = Number(memoryGet(key) ?? 0) + 1;
  if (current === 1) memorySet(key, String(current), windowSeconds);
  else {
    const entry = memory.get(key);
    if (entry) entry.value = String(current);
  }
  return current <= limit;
}
