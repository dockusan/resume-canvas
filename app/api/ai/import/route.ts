import { extractResumeText } from "@/lib/ai/extract.server";
import {
  IMPORT_FORMAT,
  IMPORT_SYSTEM,
  normalizeImport,
} from "@/lib/ai/import.server";
import { MAX_SOURCE_CHARS } from "@/lib/ai/limits";
import { AiError, completeJson } from "@/lib/ai/openrouter.server";
import { handleAiRequest } from "@/lib/ai/route.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Reads a resume — an uploaded PDF or text file, or pasted text — into the
 * editor's structure. Takes multipart form data with either `file` or `text`.
 */
export async function POST(request: Request) {
  return handleAiRequest(request, async () => {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new AiError("Malformed request.", 400);
    }

    const file = form.get("file");
    const pasted = form.get("text");
    const source =
      file instanceof File
        ? await extractResumeText(file)
        : typeof pasted === "string"
          ? pasted
          : "";

    const text = source.trim();
    if (text.length < 50) {
      throw new AiError(
        "There isn't enough text here to read a resume from.",
        422,
      );
    }
    if (text.length > MAX_SOURCE_CHARS) {
      throw new AiError(
        "That's longer than any resume we can read in one go. Trim it and try again.",
        413,
      );
    }

    const reply = await completeJson({
      system: IMPORT_SYSTEM,
      user: `Resume text:\n\n${text}`,
      format: IMPORT_FORMAT,
      maxTokens: 12_000,
    });
    return { resume: normalizeImport(reply) };
  });
}
