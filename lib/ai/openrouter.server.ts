/**
 * The one place the app talks to a language model. Server-only: the API key
 * must never reach a browser bundle.
 *
 * Goes through OpenRouter's OpenAI-compatible chat endpoint, so the model is
 * a configuration choice rather than a code change. `OPENROUTER_BASE_URL`
 * points it at any other compatible endpoint (a local model, a test double).
 * Without `OPENROUTER_API_KEY` every AI feature reports itself unavailable
 * and the editor hides its entry points.
 */

import { SITE } from "@/lib/seo";

const apiKey = process.env.OPENROUTER_API_KEY ?? "";
const baseUrl = (
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"
).replace(/\/+$/, "");

/** Cheap, fast, and supports strict JSON-schema output. */
const DEFAULT_MODEL = "anthropic/claude-haiku-5.5";
const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

export const isAiConfigured = Boolean(apiKey);

/** A failure whose message is safe to show the person who caused it. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface JsonSchema {
  name: string;
  schema: Record<string, unknown>;
}

/**
 * One structured completion: the reply is constrained to `format` and parsed.
 *
 * `require_parameters` makes OpenRouter skip providers that would silently
 * ignore the schema, so a model swap can't quietly turn the reply into prose.
 * Callers still validate what comes back — a schema constrains shape, not
 * sense.
 */
export async function completeJson(options: {
  system: string;
  user: string;
  format: JsonSchema;
  maxTokens: number;
}): Promise<unknown> {
  if (!isAiConfigured) {
    throw new AiError("AI features are not configured on this server.", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Attribution OpenRouter shows on its dashboard; optional.
        "HTTP-Referer": SITE.url,
        "X-Title": SITE.name,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { ...options.format, strict: true },
        },
        provider: { require_parameters: true },
        temperature: 0.2,
        max_tokens: options.maxTokens,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new AiError(
      timedOut
        ? "The AI took too long to answer. Please try again."
        : "Could not reach the AI service. Please try again.",
      504,
    );
  }

  if (!response.ok) {
    // Status only: the body can echo the prompt, which is someone's resume.
    console.error(`AI request failed: ${response.status}`);
    throw new AiError(
      response.status === 429
        ? "The AI service is busy. Please try again in a minute."
        : "The AI service is unavailable right now. Please try again later.",
      502,
    );
  }

  const body = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: unknown }; finish_reason?: string }[];
  } | null;
  const choice = body?.choices?.[0];
  if (choice?.finish_reason === "length") {
    throw new AiError(
      "That was too long to process in one go. Try a shorter text.",
      422,
    );
  }
  const content = choice?.message?.content;
  if (typeof content !== "string") {
    throw new AiError(
      "The AI returned an empty answer. Please try again.",
      502,
    );
  }

  try {
    // Some providers wrap JSON in a code fence even when told not to.
    return JSON.parse(
      content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, ""),
    );
  } catch {
    throw new AiError(
      "The AI returned an unreadable answer. Please try again.",
      502,
    );
  }
}
