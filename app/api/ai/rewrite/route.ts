import { AiError, completeJson } from "@/lib/ai/openrouter.server";
import {
  REWRITE_FORMAT,
  REWRITE_SYSTEM,
  normalizeRewrite,
  readRewriteRequest,
  rewritePrompt,
} from "@/lib/ai/rewrite.server";
import { handleAiRequest } from "@/lib/ai/route.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rewrites one entry's points. Body: a `RewriteRequest`.
 */
export async function POST(request: Request) {
  return handleAiRequest(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AiError("Malformed request.", 400);
    }
    const rewriteRequest = readRewriteRequest(body);

    const reply = await completeJson({
      system: REWRITE_SYSTEM,
      user: rewritePrompt(rewriteRequest),
      format: REWRITE_FORMAT,
      maxTokens: 2_000,
    });
    const rewrite = normalizeRewrite(reply);
    if (!rewrite.bullets.length) {
      throw new AiError(
        "The AI couldn't suggest anything for this entry. Try an instruction.",
        502,
      );
    }
    return { rewrite };
  });
}
