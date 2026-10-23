/**
 * Job-description requirements, matched against the evidence in a resume.
 *
 * Keyword matching says which words a posting uses; this says which of its
 * requirements the resume shows, and where. A posting is read as lines: its
 * headings ("Requirements", "Nice to have", "What you'll do") set what kind of
 * line follows, and each line under them is one requirement. Every
 * requirement is then looked for in the resume's own lines — each point,
 * the summary, the skills list — so a match can quote the line that proves
 * it rather than just counting words.
 *
 * Pure and local: nothing here leaves the browser.
 */

import { toPlainText } from "@/lib/richtext/runs";
import { ResumeData } from "@/lib/types";
import { bulletLines } from "./checks";
import { canon, tokens, usable } from "./keywords";

export type Priority = "must" | "nice" | "duty";

export interface Requirement {
  id: string;
  text: string;
  priority: Priority;
  /** Distinctive terms, alias-folded. */
  terms: string[];
  /** "5+ years of …" — checked against the roles' dates instead of words. */
  minYears?: number;
}

/** One line of the resume a requirement can be shown by. */
export interface Evidence {
  id: string;
  /** Where it is: "Senior Engineer · Acme", "Summary", "Skills". */
  where: string;
  text: string;
  /** Present for a point inside an item, so it can be rewritten in place. */
  ref?: { section: string; itemId: string; line: number };
}

export type MatchStatus = "shown" | "partial" | "missing";

export interface RequirementMatch {
  requirement: Requirement;
  status: MatchStatus;
  /** The strongest lines, best first. */
  evidence: Evidence[];
  missingTerms: string[];
  /** Set for a years requirement: the resume's span of experience. */
  years?: number;
}

/** Words that appear in most requirements and identify none of them. */
const GENERIC = new Set(
  `build building built develop developing design designing deliver delivering drive driving support supporting
  maintain maintaining create creating write writing ensure ensuring across within high quality best practice
  practices large scale new existing complex multiple various related across partner partnering collaborate
  collaborating closely stakeholders cross-functional own owning ownership communication communicate written
  verbal clear clearly passion passionate motivated self-starter detail-oriented attention detail fast-paced
  environment products product customers customer business problems problem solving solutions solution systems run running
  system using tools tool technologies technology services service hands-on deep broad plus proficiency proficient
  familiar familiarity comfortable expertise expert understanding working knowledge hands`
    .split(/\s+/)
    .filter(Boolean),
);

/** Headings over text that asks for nothing: the company, the perks. */
const SKIP =
  /^(about (the|us|our)|who we are|our (company|mission|team)|the company|benefits|perks|what we offer|compensation|salary|how to apply|equal opportunit)/i;

const HEADINGS: [RegExp, Priority][] = [
  [
    /nice[- ]to[- ]have|preferred|bonus|a plus|desirable|would be (great|nice)/i,
    "nice",
  ],
  [
    /responsibilit|what you('| wi)ll do|day[- ]to[- ]day|the role|your role|in this role|you will/i,
    "duty",
  ],
  [
    /requirement|qualification|must[- ]have|what you('ll)? (need|bring)|you (have|bring|should)|about you|who you are|skills|experience|what we('re)? look/i,
    "must",
  ],
];

const BULLET = /^\s*(?:[-•*◦▪–]|\d+[.)])\s+/;
const NICE_INLINE = /\b(nice to have|preferred|is a plus|a bonus|bonus)\b/i;
const YEARS = /(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs)/i;

function isHeading(line: string) {
  const text = line.replace(/[:：]\s*$/, "").trim();
  return (
    !BULLET.test(line) &&
    text.length > 2 &&
    text.length <= 60 &&
    (line.trim().endsWith(":") || !/[.!?]$/.test(text)) &&
    text.split(/\s+/).length <= 8
  );
}

/**
 * The form a term is compared in: aliases folded, then a light stem so
 * "engineering" meets "engineer" and "reviews" meets "review".
 */
export const termKey = (term: string) => {
  const t = canon(term);
  return t.length > 5 && !t.includes(" ") ? t.replace(/(ing|ed|es|s)$/, "") : t;
};

export function termsOf(text: string): string[] {
  const seen = new Set<string>();
  for (const t of tokens(text)) {
    if (!usable(t) || GENERIC.has(t)) continue;
    seen.add(canon(t));
  }
  return [...seen];
}

/** Requirements in the order the posting lists them. */
export function extractRequirements(jobText: string): Requirement[] {
  const lines = jobText.split(/\r?\n/);
  const out: Requirement[] = [];
  let section: Priority | null = null;
  let sawHeading = false;

  const push = (raw: string, priority: Priority) => {
    const text = raw.replace(BULLET, "").replace(/\s+/g, " ").trim();
    const terms = termsOf(text);
    const years = text.match(YEARS);
    if (!terms.length && !years) return;
    out.push({
      id: `r${out.length + 1}`,
      text,
      priority: NICE_INLINE.test(text) ? "nice" : priority,
      terms,
      ...(years ? { minYears: Number(years[1]) } : {}),
    });
  };

  for (const line of lines) {
    if (!line.trim()) continue;
    if (isHeading(line)) {
      const kind = SKIP.test(line.trim())
        ? null
        : (HEADINGS.find(([re]) => re.test(line))?.[1] ?? null);
      section = kind;
      sawHeading = true;
      continue;
    }
    if (section) push(line, section);
    else if (!sawHeading && BULLET.test(line)) push(line, "must");
  }

  // A posting written as prose: take the sentences that ask for something.
  if (!out.length) {
    for (const sentence of jobText.split(/(?<=[.!?])\s+|\n+/)) {
      if (
        /\b(experience|years|knowledge|proficien|familiar|degree|ability|skills?)\b/i.test(
          sentence,
        )
      )
        push(sentence, "must");
    }
  }
  return out.slice(0, 40);
}

const plain = (v: unknown) =>
  typeof v === "string" ? toPlainText(v).replace(/\s+/g, " ").trim() : "";

/** Every line of the resume that could stand as evidence. */
export function resumeEvidence(data: ResumeData): Evidence[] {
  const out: Evidence[] = [];
  const add = (e: Omit<Evidence, "id">) => {
    if (e.text) out.push({ id: `e${out.length + 1}`, ...e });
  };

  add({ where: "Summary", text: plain(data.personalInfo.summary) });
  add({ where: "Headline", text: plain(data.personalInfo.title) });

  const withPoints = (
    section: string,
    items: { id: string; description?: string }[],
    label: (item: Record<string, unknown>) => string,
  ) => {
    for (const item of items) {
      const where = label(item as Record<string, unknown>);
      add({ where, text: where });
      bulletLines(item.description).forEach((text, line) =>
        add({ where, text, ref: { section, itemId: item.id, line } }),
      );
    }
  };

  withPoints("experience", data.experience, (e) =>
    [plain(e.title), plain(e.company)].filter(Boolean).join(" · "),
  );
  withPoints("projects", data.projects, (p) => plain(p.name) || "Project");
  for (const c of data.customSections)
    withPoints(`custom:${c.id}`, c.items, (i) => plain(i.title) || "Entry");

  for (const e of data.education)
    add({
      where: "Education",
      text: [plain(e.degree), plain(e.school)].filter(Boolean).join(", "),
    });
  for (const c of data.certifications)
    add({
      where: "Certifications",
      text: [plain(c.name), plain(c.issuer)].filter(Boolean).join(", "),
    });
  for (const s of data.strengths)
    add({
      where: "Strengths",
      text: [plain(s.title), plain(s.description)].filter(Boolean).join(": "),
    });
  const skills = data.skills.map((s) => plain(s.name)).filter(Boolean);
  if (skills.length) add({ where: "Skills", text: skills.join(", ") });
  const languages = data.languages.map((l) => plain(l.name)).filter(Boolean);
  if (languages.length) add({ where: "Languages", text: languages.join(", ") });

  return out;
}

function monthIndex(v: string | undefined): number | null {
  const m = (v ?? "").match(/^(\d{4})-(\d{1,2})$/);
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null;
}

/** Years covered by the roles' dates, overlapping roles counted once. */
export function yearsOfExperience(data: ResumeData, now = new Date()): number {
  const today = now.getFullYear() * 12 + now.getMonth();
  const spans = data.experience
    .map((e) => {
      const start = monthIndex(e.startDate);
      const end = e.current ? today : monthIndex(e.endDate);
      return start !== null && end !== null && end >= start
        ? ([start, end] as const)
        : null;
    })
    .filter((s): s is readonly [number, number] => s !== null)
    .sort((a, b) => a[0] - b[0]);
  let months = 0;
  let cursor = -Infinity;
  for (const [start, end] of spans) {
    const from = Math.max(start, cursor);
    if (end > from) months += end - from;
    cursor = Math.max(cursor, end);
  }
  return Math.floor(months / 12);
}

/** How far each requirement is shown by the resume, with the proof. */
export function matchRequirements(
  requirements: Requirement[],
  data: ResumeData,
  now = new Date(),
): RequirementMatch[] {
  const evidence = resumeEvidence(data).map((e) => ({
    e,
    terms: new Set(tokens(e.text).map(termKey)),
  }));
  const years = yearsOfExperience(data, now);

  return requirements.map((requirement) => {
    const scored = evidence
      .map(({ e, terms }) => ({
        e,
        hits: requirement.terms.filter((t) => terms.has(termKey(t))),
      }))
      .filter((s) => s.hits.length > 0)
      .sort(
        (a, b) =>
          b.hits.length - a.hits.length ||
          // A point is better proof than a heading or a skills list.
          Number(!!b.e.ref) - Number(!!a.e.ref) ||
          a.e.text.length - b.e.text.length,
      );
    const found = new Set(scored.flatMap((s) => s.hits));
    const missingTerms = requirement.terms.filter((t) => !found.has(t));
    const best = scored[0]?.hits.length ?? 0;
    const need = Math.max(1, Math.ceil(requirement.terms.length * 0.6));

    let status: MatchStatus =
      best >= need ? "shown" : found.size > 0 ? "partial" : "missing";

    if (requirement.minYears !== undefined) {
      const enough = years >= requirement.minYears;
      // Years are the requirement; the field ("of backend work") refines it.
      status = enough
        ? status === "shown" || !requirement.terms.length
          ? "shown"
          : "partial"
        : status === "missing"
          ? "missing"
          : "partial";
    }

    return {
      requirement,
      status,
      evidence: scored.slice(0, 2).map((s) => s.e),
      missingTerms,
      ...(requirement.minYears !== undefined ? { years } : {}),
    };
  });
}
