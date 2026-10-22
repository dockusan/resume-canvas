/**
 * Job match: evidence-based edits for requirements a resume doesn't fully
 * show yet.
 */

import { keepsToEvidence } from "./evidence";
import { MAX_SOURCE_CHARS } from "./limits";
import { AiError, JsonSchema } from "./openrouter.server";
import { line, list, obj, s } from "./sanitize.server";
import { MatchRequest, MatchSuggestion } from "./types";

export const MATCH_SYSTEM = `You help someone tailor their resume to a job posting, using only what their resume already says.

You get requirements from the posting that the resume doesn't clearly show yet, and the resume's own lines, each with an id. Some lines are editable points; the rest (headings, skills, education) are context.

For each requirement, do exactly one of:
1. Rewrite: if an editable line already shows the requirement — the same skill, tool or kind of work, said differently or left implicit — rewrite that one line so a reader and a parser see it. Keep every fact, name and number in it. Add no facts: no new numbers, tools, employers, team sizes, outcomes or claims that the line and the context don't state. Prefer the posting's wording where it is true. Keep resume style: a strong verb first, no first person, about the same length.
2. Question: if nothing in the resume supports it, ask the person one short question that would let them add it truthfully if it is true ("Have you run Kubernetes in production? If so, where?"). Never draft a line for experience the resume doesn't show.

Return at most one suggestion per requirement. "why" says in one short sentence which part of the line supports the requirement; empty for a question.`;

export const MATCH_FORMAT: JsonSchema = {
  name: "job_match",
  schema: s.object({
    suggestions: s.array(
      s.object({
        requirementId: s.string("The requirement's id."),
        evidenceId: s.string(
          'The id of the line to rewrite, or "" for a question.',
        ),
        revised: s.string('The rewritten line, or "" for a question.'),
        why: s.string(),
        question: s.string('The question, or "" for a rewrite.'),
      }),
    ),
  }),
};

export function readMatchRequest(body: unknown): MatchRequest {
  const b = obj(body);
  const requirements = list(b.requirements, 20)
    .map((r) => {
      const o = obj(r);
      return { id: line(o.id, 20), text: line(o.text, 300) };
    })
    .filter((r) => r.id && r.text);
  const evidence = list(b.evidence, 120)
    .map((e) => {
      const o = obj(e);
      return {
        id: line(o.id, 20),
        where: line(o.where, 120),
        text: line(o.text, 400),
        editable: o.editable === true,
      };
    })
    .filter((e) => e.id && e.text);

  if (!requirements.length) {
    throw new AiError("Every requirement is already shown.", 422);
  }
  if (!evidence.length) {
    throw new AiError("Your resume has nothing to work from yet.", 422);
  }
  const size =
    requirements.reduce((n, r) => n + r.text.length, 0) +
    evidence.reduce((n, e) => n + e.text.length + e.where.length, 0);
  if (size > MAX_SOURCE_CHARS) {
    throw new AiError("This resume is too long to match in one go.", 413);
  }
  return { requirements, evidence };
}

export function matchPrompt(r: MatchRequest): string {
  const reqs = r.requirements.map((q) => `[${q.id}] ${q.text}`).join("\n");
  const lines = r.evidence
    .map(
      (e) =>
        `[${e.id}]${e.editable ? " (editable)" : ""} ${e.where} — ${e.text}`,
    )
    .join("\n");
  return `Requirements not yet clearly shown:\n${reqs}\n\nResume lines:\n${lines}`;
}

/**
 * The model's answer, kept only where it holds up: a rewrite must target an
 * editable line it was given and add no number that line lacks; anything
 * else is dropped.
 */
export function normalizeMatch(
  raw: unknown,
  request: MatchRequest,
): MatchSuggestion[] {
  const requirementIds = new Set(request.requirements.map((r) => r.id));
  const editable = new Map(
    request.evidence.filter((e) => e.editable).map((e) => [e.id, e.text]),
  );
  const seen = new Set<string>();
  const out: MatchSuggestion[] = [];

  for (const item of list(obj(raw).suggestions, 40)) {
    const o = obj(item);
    const suggestion: MatchSuggestion = {
      requirementId: line(o.requirementId, 20),
      evidenceId: line(o.evidenceId, 20),
      revised: line(o.revised, 400),
      why: line(o.why, 200),
      question: line(o.question, 200),
    };
    if (!requirementIds.has(suggestion.requirementId)) continue;
    if (seen.has(suggestion.requirementId)) continue;

    if (suggestion.revised) {
      const original = editable.get(suggestion.evidenceId);
      if (!original) continue;
      if (suggestion.revised === original) continue;
      if (!keepsToEvidence(original, suggestion.revised)) continue;
      suggestion.question = "";
    } else if (suggestion.question) {
      suggestion.evidenceId = "";
      suggestion.why = "";
    } else {
      continue;
    }
    seen.add(suggestion.requirementId);
    out.push(suggestion);
  }
  return out;
}
