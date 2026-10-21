/**
 * Quick add: a few lines in someone's own words, drafted into resume entries.
 */

import { JsonSchema } from "./openrouter.server";
import {
  DATE_RULE,
  draftItem,
  draftItemSchema,
  line,
  list,
  obj,
  prose,
  s,
} from "./sanitize.server";
import { QUICK_ADD_SECTIONS, QuickAddDraft, QuickAddSection } from "./types";

export const QUICK_ADD_SYSTEM = `You help someone add to their resume. They describe something in their own words — a job, a degree, a project, a list of skills, a certificate — and you draft it as polished entries they can drop straight in.

Writing:
- Write in the language of the description.
- Resume style: concise, specific, no first person. Start bullets with a strong verb; past tense for finished work, present tense for current work. Two to five bullets per entry, one idea each.
- Keep every fact, name and number given. Never invent metrics, employers, dates, technologies, titles or outcomes that were not stated — a strong bullet without a number beats a fabricated one.
- Dates: ${DATE_RULE}

Choosing the section: the request names a target section. When it is "auto", pick the one that fits best; "custom" means anything that isn't one of the others (awards, volunteering, publications…), with a short heading in sectionTitle.

How each section uses an item:
- experience: title = job title, subtitle = company, location, startDate / endDate / current, bullets.
- education: title = degree and field, subtitle = school, location, startDate / endDate / current. No bullets.
- projects: title = project name, link, date, bullets.
- skills: one item per skill, title only (short names, not sentences).
- languages: one item per language, title = language, subtitle = one of Native, Fluent, Proficient, Intermediate, Basic.
- certifications: title = certificate name, subtitle = issuer, date, link.
- strengths: title = the strength in two to four words, bullets = one sentence backing it up.
- summary: no items; write summary as two to four sentences.
- custom: title, subtitle, date, link and bullets as they fit.
Leave unused fields "" (or empty).

suggestions: up to three short, specific prompts for what is missing and would make this stronger — a metric, a date, the team size, the impact. Phrase them as questions to the person, in their language. Leave empty when nothing important is missing.`;

export const QUICK_ADD_FORMAT: JsonSchema = {
  name: "resume_draft",
  schema: s.object({
    section: s.enum(QUICK_ADD_SECTIONS),
    sectionTitle: s.string('Heading for a custom section, otherwise "".'),
    summary: s.string('Only for the summary section, otherwise "".'),
    items: s.array(draftItemSchema("One resume entry.")),
    suggestions: s.array(s.string()),
  }),
};

export function quickAddPrompt(options: {
  text: string;
  target: QuickAddSection | "auto";
  sectionTitle?: string;
}): string {
  const target =
    options.target === "custom" && options.sectionTitle
      ? `custom (an existing section titled "${options.sectionTitle}")`
      : options.target;
  return `Target section: ${target}\n\nDescription:\n${options.text}`;
}

export function normalizeQuickAdd(
  raw: unknown,
  target: QuickAddSection | "auto",
): QuickAddDraft {
  const r = obj(raw);
  // An explicit choice stands even if the model disagrees with it.
  const section: QuickAddSection =
    target !== "auto"
      ? target
      : (QUICK_ADD_SECTIONS.find((id) => id === r.section) ?? "custom");

  return {
    section,
    sectionTitle: section === "custom" ? line(r.sectionTitle, 80) : "",
    summary: section === "summary" ? prose(r.summary, 1500) : "",
    items:
      section === "summary"
        ? []
        : list(r.items, section === "skills" ? 40 : 10)
            .map(draftItem)
            .filter((i) => i.title || i.bullets.length),
    suggestions: list(r.suggestions, 3)
      .map((v) => line(v, 200))
      .filter(Boolean),
  };
}
