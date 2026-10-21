import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai/openrouter.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lets the editor hide AI entry points on a deployment without a key. */
export function GET() {
  return NextResponse.json(
    { enabled: isAiConfigured },
    { headers: { "cache-control": "no-store" } },
  );
}
