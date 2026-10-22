/**
 * Rewrite: one entry's points, improved in place from the canvas.
 */

import { MAX_INSTRUCTION_CHARS, MAX_OVERVIEW_CHARS } from "./limits";
import { AiError, JsonSchema } from "./openrouter.server";
import { bullets, line, list, obj, s } from "./sanitize.server";
import { Rewrite, RewriteKind, RewriteRequest } from "./types";

export const REWRITE_SYSTEM = `You improve one entry on someone's resume. You get the entry — a job, a project or another item — with the points it currently lists, and sometimes an instruction from the person. Return a new list of points that replaces the current one.

Writing:
- Follow the instruction when there is one: tone, length, focus or language. Without one, write in the language of the current points.
- Resume style: concise, specific, no first person. Start each point with a strong verb; past tense for finished work, present tense for ongoing work. Two to six points, one idea each — merge duplicates, split run-ons.
- Lead with impact: what changed because of the work. Put the strongest point first.
- Keep every fact, name, number and technology given. Never invent metrics, employers, tools, team sizes or outcomes that are not in the entry or the instruction — a strong point without a number beats a fabricated one.
- With no current points, draft them only from what the entry and the instruction state.

notes: up to three short, specific questions about what is missing and would make the points stronger — a metric, the scale, the outcome. Write them in the language of the points. Leave empty when nothing important is missing.`;

export const REWRITE_FORMAT: JsonSchema = {
  name: "resume_rewrite",
  schema: s.object({
    bullets: s.array(
      s.string(),
      "The new points, one per string, no bullet characters.",
    ),
    notes: s.array(s.string()),
  }),
};

const KINDS: Record<RewriteKind, string> = {
  experience: "work experience",
  projects: "project",
  custom: "resume entry",
};

/** Validates a request body; the message of any rejection is shown as is. */
export function readRewriteRequest(body: unknown): RewriteRequest {
  const b = obj(body);
  const kind = (Object.keys(KINDS) as RewriteKind[]).find((k) => k === b.kind);
  if (!kind) throw new AiError("Malformed request.", 400);

  const request: RewriteRequest = {
    kind,
    title: line(b.title),
    subtitle: line(b.subtitle, 300),
    dates: line(b.dates, 60),
    bullets: bullets(b.bullets, 30),
    instruction: line(b.instruction, MAX_INSTRUCTION_CHARS),
  };

  const size = request.bullets.join("\n").length + request.instruction.length;
  if (size > MAX_OVERVIEW_CHARS) {
    throw new AiError(
      "This entry is too long to rewrite in one go. Split it first.",
      413,
    );
  }
  if (!request.bullets.length && !request.instruction) {
    throw new AiError(
      "This entry has no points yet. Write a few, or say what you did in the instruction.",
      422,
    );
  }
  return request;
}

export function rewritePrompt(r: RewriteRequest): string {
  const entry = [
    `Entry type: ${KINDS[r.kind]}`,
    r.title && `Title: ${r.title}`,
    r.subtitle && `Details: ${r.subtitle}`,
    r.dates && `Dates: ${r.dates}`,
    `Instruction: ${r.instruction || "(none — improve the wording)"}`,
  ].filter(Boolean);
  const points = r.bullets.length
    ? r.bullets.map((b) => `- ${b}`).join("\n")
    : "(none)";
  return `${entry.join("\n")}\n\nCurrent points:\n${points}`;
}

export function normalizeRewrite(raw: unknown): Rewrite {
  const r = obj(raw);
  return {
    bullets: bullets(r.bullets, 8),
    notes: list(r.notes, 3)
      .map((v) => line(v, 200))
      .filter(Boolean),
  };
}
