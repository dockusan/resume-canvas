/**
 * Coercions for model output. A JSON schema constrains the reply's shape, but
 * a provider that ignores it — or a model that pads a field with a paragraph —
 * must still never put something malformed into someone's resume.
 */

import { normalizeUrl } from "@/lib/richtext/runs";
import { DraftItem, PROFICIENCIES, Proficiency } from "./types";

export type Loose = Record<string, unknown>;

export const obj = (value: unknown): Loose =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Loose)
    : {};

export function list(value: unknown, max: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

/** One line of text, whitespace collapsed. */
export function line(value: unknown, max = 200): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Free text that may keep its paragraph breaks. */
export function prose(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value
    .split(/\n/)
    .map((l) => l.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

const BULLET_MARK = /^\s*[•\-*◦▪●·–]+\s*/;

export function bullets(value: unknown, max = 12): string[] {
  return list(value, max)
    .map((b) => line(b, 500).replace(BULLET_MARK, ""))
    .filter(Boolean);
}

const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const yearMonth = (year: string, m: number) =>
  m >= 1 && m <= 12 ? `${year}-${String(m).padStart(2, "0")}` : year;

/**
 * The date picker stores "YYYY-MM"; a bare year is also valid and prints as
 * written. The forms resumes print most ("Dec 2020", "12/2020") are read too,
 * since models echo them despite the schema; anything else becomes empty
 * rather than a half-parsed value.
 */
export function month(value: unknown): string {
  const v = line(value, 20);
  const ym = v.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) return yearMonth(ym[1], Number(ym[2]));
  const my = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (my) return yearMonth(my[2], Number(my[1]));
  const named = v.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/i);
  if (named) {
    const m = MONTH_NAMES.indexOf(named[1].toLowerCase()) + 1;
    return m ? yearMonth(named[2], m) : named[2];
  }
  return /^\d{4}$/.test(v) ? v : "";
}

/** Single dates (projects, certificates) are free text on the page. */
export const looseDate = (value: unknown) => line(value, 40);

export function url(value: unknown): string {
  const v = line(value, 300);
  return v ? normalizeUrl(v) : "";
}

export function proficiency(value: unknown): Proficiency {
  const v = line(value, 20).toLowerCase();
  return PROFICIENCIES.find((p) => p.toLowerCase() === v) ?? "Proficient";
}

export function draftItem(value: unknown): DraftItem {
  const o = obj(value);
  const current = o.current === true;
  return {
    title: line(o.title),
    subtitle: line(o.subtitle),
    location: line(o.location, 100),
    startDate: month(o.startDate),
    endDate: current ? "" : month(o.endDate),
    current,
    date: looseDate(o.date),
    link: url(o.link),
    bullets: bullets(o.bullets),
  };
}

// ---- JSON schema builders (strict mode: every key required, no extras) ----

export const s = {
  string: (description?: string) => ({ type: "string", description }),
  boolean: (description?: string) => ({ type: "boolean", description }),
  enum: (values: readonly string[], description?: string) => ({
    type: "string",
    enum: values,
    description,
  }),
  array: (items: unknown, description?: string) => ({
    type: "array",
    items,
    description,
  }),
  object: (properties: Record<string, unknown>, description?: string) => ({
    type: "object",
    description,
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  }),
};

export const DATE_RULE =
  '"YYYY-MM" when the month is known, "YYYY" when only the year is, "" when not stated.';

export const draftItemSchema = (description: string) =>
  s.object(
    {
      title: s.string(),
      subtitle: s.string(),
      location: s.string(),
      startDate: s.string(DATE_RULE),
      endDate: s.string(`${DATE_RULE} "" when current.`),
      current: s.boolean("True when it is ongoing (Present, now)."),
      date: s.string("A single date or year, for things that happen once."),
      link: s.string('A URL, or "".'),
      bullets: s.array(
        s.string(),
        "One point per string, no bullet characters.",
      ),
    },
    description,
  );
