/**
 * Plain-text export for applicant tracking systems.
 *
 * ATS parsers read a PDF's text stream linearly and cope badly with columns,
 * icons and decorative glyphs — a two-column resume can interleave into
 * nonsense. This produces a single-column, marker-free rendition of the same
 * content so the machine-read version says what the designed one says.
 */

import { toPlainText } from "@/lib/richtext/runs";
import { ResumeDocument, SectionNode } from "@/lib/schema/document";
import { isFieldVisible } from "@/lib/schema/field-visibility";
import { PersonalContactField, ResumeData } from "@/lib/types";
import { isPersonalFieldVisible } from "@/lib/personal-fields";

const clean = (value: unknown): string =>
  typeof value === "string"
    ? toPlainText(value).replace(/\s+/g, " ").trim()
    : "";

/** Join the parts of one line, skipping anything hidden or empty. */
const join = (parts: (string | undefined | false)[], sep = " | ") =>
  parts.filter((p): p is string => !!p && p.length > 0).join(sep);

function dateRange(item: {
  startDate?: string;
  endDate?: string;
  current?: boolean;
}): string {
  const start = clean(item.startDate);
  const end = item.current ? "Present" : clean(item.endDate);
  if (!start && !end) return "";
  return `${start || "?"} – ${end || "?"}`;
}

/**
 * Bullets keep a leading dash: parsers treat them as list items. Split on the
 * newlines *before* collapsing whitespace, or every bullet merges into one.
 */
function bullets(description?: string): string[] {
  return toPlainText(description ?? "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^[•\-*◦▪]\s*/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .map((line) => `- ${line}`);
}

function sectionBody(node: SectionNode, data: ResumeData): string[] {
  const visible = (key: string) => isFieldVisible(node, key);
  const out: string[] = [];

  switch (node.type) {
    case "summary":
      out.push(clean(data.personalInfo.summary));
      break;

    case "experience":
      for (const item of data.experience) {
        out.push(
          join([
            visible("title") && clean(item.title),
            visible("company") && clean(item.company),
            visible("location") && clean(item.location),
            visible("date") && dateRange(item),
          ]),
        );
        if (visible("description")) out.push(...bullets(item.description));
        out.push("");
      }
      break;

    case "education":
      for (const item of data.education) {
        out.push(
          join([
            visible("degree") && clean(item.degree),
            visible("school") && clean(item.school),
            visible("location") && clean(item.location),
            visible("date") && dateRange(item),
          ]),
        );
      }
      break;

    case "projects":
      for (const item of data.projects) {
        out.push(
          join([
            visible("name") && clean(item.name),
            visible("date") && clean(item.date),
            visible("link") && clean(item.link),
          ]),
        );
        if (visible("description")) out.push(...bullets(item.description));
        out.push("");
      }
      break;

    case "skills":
      // One comma-separated line parses far more reliably than a chip grid.
      out.push(
        data.skills
          .map((s) => clean(s.name))
          .filter(Boolean)
          .join(", "),
      );
      break;

    case "languages":
      for (const item of data.languages) {
        out.push(
          join(
            [
              clean(item.name),
              visible("proficiency") && clean(item.proficiency),
            ],
            " — ",
          ),
        );
      }
      break;

    case "certifications":
      for (const item of data.certifications) {
        out.push(
          join([
            clean(item.name),
            visible("issuer") && clean(item.issuer),
            visible("date") && clean(item.date),
            visible("link") && clean(item.link),
          ]),
        );
        if (visible("description") && item.description)
          out.push(...bullets(item.description));
      }
      break;

    case "strengths":
      for (const item of data.strengths) {
        out.push(
          join(
            [
              clean(item.title),
              visible("description") && clean(item.description),
            ],
            " — ",
          ),
        );
      }
      break;

    case "socials":
      for (const item of data.socials) {
        out.push(join([clean(item.platform), clean(item.url)], ": "));
      }
      break;

    case "custom": {
      const uuid = node.sourceId ?? node.id.replace(/^custom:/, "");
      const custom = data.customSections.find((c) => c.id === uuid);
      for (const item of custom?.items ?? []) {
        out.push(
          join([
            visible("title") && clean(item.title),
            visible("subtitle") && clean(item.subtitle),
            visible("date") && clean(item.date),
            visible("link") && clean(item.link),
          ]),
        );
        if (visible("description")) out.push(...bullets(item.description));
      }
      break;
    }
  }

  return out;
}

const CONTACT_ORDER: PersonalContactField[] = [
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
  "twitter",
];

export function toAtsText(
  doc: ResumeDocument,
  data: ResumeData,
  settings: {
    personalFieldVisibility?: Partial<Record<PersonalContactField, boolean>>;
  },
): string {
  const lines: string[] = [];
  const info = data.personalInfo;

  lines.push(clean(info.fullName));
  if (isPersonalFieldVisible(settings, "title") && info.title) {
    lines.push(clean(info.title));
  }
  const contacts = CONTACT_ORDER.filter(
    (f) => isPersonalFieldVisible(settings, f) && info[f],
  ).map((f) => clean(info[f]));
  if (contacts.length) lines.push(contacts.join(" | "));
  lines.push("");

  // Columns are flattened to reading order: left column first, then right.
  const order = { left: 0, full: 0, right: 1 } as const;
  const sections = doc.sections
    .filter((s) => s.visible)
    .sort(
      (a, b) =>
        order[a.placement.column] - order[b.placement.column] ||
        a.placement.order - b.placement.order,
    );

  for (const node of sections) {
    const body = sectionBody(node, data).map((l) => l.trimEnd());
    if (!body.some((l) => l.length > 0)) continue;
    lines.push(clean(node.title).toUpperCase());
    lines.push("");
    lines.push(...body);
    lines.push("");
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
}
