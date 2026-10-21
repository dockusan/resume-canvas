/**
 * Rate-limit bucket for the caller.
 *
 * The address is hashed and only the digest is stored, for one window. There
 * is deliberately no way to go from a stored bucket back to who made the
 * request.
 */
export async function clientBucket(request: Request): Promise<string> {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(address),
  );
  return Buffer.from(digest).toString("hex").slice(0, 32);
}
