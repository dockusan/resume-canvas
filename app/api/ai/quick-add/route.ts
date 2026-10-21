import { MAX_OVERVIEW_CHARS } from "@/lib/ai/limits";
import { AiError, completeJson } from "@/lib/ai/openrouter.server";
import {
  QUICK_ADD_FORMAT,
  QUICK_ADD_SYSTEM,
  normalizeQuickAdd,
  quickAddPrompt,
} from "@/lib/ai/quick-add.server";
import { handleAiRequest } from "@/lib/ai/route.server";
import { QUICK_ADD_SECTIONS, QuickAddSection } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Drafts resume entries from a short description.
 * Body: `{ text, target: QuickAddSection | "auto", sectionTitle? }`.
 */
export async function POST(request: Request) {
  return handleAiRequest(request, async () => {
    let body: { text?: unknown; target?: unknown; sectionTitle?: unknown };
    try {
      body = await request.json();
    } catch {
      throw new AiError("Malformed request.", 400);
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < 3) {
      throw new AiError("Describe what you want to add first.", 422);
    }
    if (text.length > MAX_OVERVIEW_CHARS) {
      throw new AiError(
        `Keep it under ${MAX_OVERVIEW_CHARS.toLocaleString("en")} characters — a few lines is plenty.`,
        413,
      );
    }

    const target: QuickAddSection | "auto" =
      QUICK_ADD_SECTIONS.find((id) => id === body.target) ?? "auto";
    const sectionTitle =
      typeof body.sectionTitle === "string"
        ? body.sectionTitle.slice(0, 80)
        : undefined;

    const reply = await completeJson({
      system: QUICK_ADD_SYSTEM,
      user: quickAddPrompt({ text, target, sectionTitle }),
      format: QUICK_ADD_FORMAT,
      maxTokens: 4_000,
    });
    return { draft: normalizeQuickAdd(reply, target) };
  });
}
