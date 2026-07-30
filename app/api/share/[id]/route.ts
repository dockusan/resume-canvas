import { NextResponse } from "next/server";
import { getShare } from "@/lib/share/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

/** Ids are base64url of 16 bytes; anything else never existed. */
const VALID_ID = /^[A-Za-z0-9_-]{16,64}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!VALID_ID.test(id)) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: noStore },
    );
  }

  const record = await getShare(id);
  // An expired key is simply absent, so "expired" and "never existed" look
  // identical from outside. That is the right amount to tell a stranger.
  if (!record) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: noStore },
    );
  }

  return NextResponse.json(record, { headers: noStore });
}
