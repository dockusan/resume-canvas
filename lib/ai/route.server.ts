import { NextResponse } from "next/server";
import { clientBucket } from "@/lib/server/client-bucket.server";
import { withinRateLimit } from "@/lib/share/store.server";
import { AI_LIMIT, AI_WINDOW_SECONDS } from "./limits";
import { AiError, isAiConfigured } from "./openrouter.server";

const noStore = { "cache-control": "no-store" };

/**
 * The checks every AI route shares, in the order that keeps them cheap:
 * configured at all, then rate limit, then the handler. Resume text passes
 * through but is never logged or stored — only an `AiError`'s own message
 * ever reaches the response.
 */
export async function handleAiRequest(
  request: Request,
  handler: () => Promise<unknown>,
): Promise<NextResponse> {
  if (!isAiConfigured) {
    return NextResponse.json(
      { error: "AI features are not configured on this deployment." },
      { status: 503, headers: noStore },
    );
  }

  if (
    !(await withinRateLimit(
      `ai:${await clientBucket(request)}`,
      AI_LIMIT,
      AI_WINDOW_SECONDS,
    ))
  ) {
    return NextResponse.json(
      {
        error: "You've hit the hourly limit for AI requests. Try again later.",
      },
      { status: 429, headers: noStore },
    );
  }

  try {
    return NextResponse.json(await handler(), { headers: noStore });
  } catch (err) {
    if (err instanceof AiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status, headers: noStore },
      );
    }
    console.error("AI route failed:", err instanceof Error ? err.name : err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: noStore },
    );
  }
}
