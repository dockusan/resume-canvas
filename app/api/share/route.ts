import { NextRequest, NextResponse } from "next/server";
import {
  CREATE_LIMIT,
  CREATE_WINDOW_SECONDS,
  MAX_BLOB_BYTES,
  clampExpiryDays,
} from "@/lib/share/limits";
import { clientBucket } from "@/lib/server/client-bucket.server";
import {
  isPersistent,
  putShare,
  withinRateLimit,
} from "@/lib/share/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

/** 16 random bytes: not enumerable, not guessable, short enough to paste. */
function newShareId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(bytes).toString("base64url");
}

export async function POST(request: NextRequest) {
  if (!isPersistent && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Sharing is not configured on this deployment." },
      { status: 503, headers: noStore },
    );
  }

  let body: { ciphertext?: unknown; iv?: unknown; expiresInDays?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Malformed request." },
      { status: 400, headers: noStore },
    );
  }

  const { ciphertext, iv } = body;
  if (typeof ciphertext !== "string" || typeof iv !== "string" || !ciphertext) {
    return NextResponse.json(
      { error: "Malformed request." },
      { status: 400, headers: noStore },
    );
  }

  if (ciphertext.length + iv.length > MAX_BLOB_BYTES) {
    return NextResponse.json(
      {
        error:
          "This resume is too large to share. Try replacing the photo with a smaller image.",
      },
      { status: 413, headers: noStore },
    );
  }

  if (
    !(await withinRateLimit(
      await clientBucket(request),
      CREATE_LIMIT,
      CREATE_WINDOW_SECONDS,
    ))
  ) {
    return NextResponse.json(
      { error: "Too many links created. Try again in an hour." },
      { status: 429, headers: noStore },
    );
  }

  // The client's request is a suggestion; the ceiling is set here.
  const expiresInDays = clampExpiryDays(body.expiresInDays);
  const id = newShareId();
  const ttlSeconds = expiresInDays * 24 * 60 * 60;

  try {
    await putShare(id, { ciphertext, iv }, ttlSeconds);
  } catch {
    return NextResponse.json(
      { error: "Could not create the link. Please try again." },
      { status: 502, headers: noStore },
    );
  }

  return NextResponse.json(
    { id, expiresInDays, expiresAt: Date.now() + ttlSeconds * 1000 },
    { headers: noStore },
  );
}
