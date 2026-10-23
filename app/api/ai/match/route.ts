import {
  MATCH_FORMAT,
  MATCH_SYSTEM,
  matchPrompt,
  normalizeMatch,
  readMatchRequest,
} from "@/lib/ai/match.server";
import { AiError, completeJson } from "@/lib/ai/openrouter.server";
import { handleAiRequest } from "@/lib/ai/route.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Suggests evidence-based edits for a job's requirements. Body: a
 * `MatchRequest`.
 */
export async function POST(request: Request) {
  return handleAiRequest(request, async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AiError("Malformed request.", 400);
    }
    const matchRequest = readMatchRequest(body);
    const reply = await completeJson({
      system: MATCH_SYSTEM,
      user: matchPrompt(matchRequest),
      format: MATCH_FORMAT,
      maxTokens: 3_000,
    });
    return { suggestions: normalizeMatch(reply, matchRequest) };
  });
}
