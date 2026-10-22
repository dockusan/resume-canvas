/**
 * Word export.
 *
 * Some portals and recruiters still ask for .docx. This writes the same
 * single-column structure as the plain-text ATS copy — standard headings,
 * real Word bullets, dates on a right tab stop — in a font every parser
 * handles. Loaded on demand so the `docx` library stays out of the main
 * bundle.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import { DEFAULT_DATE_FORMAT, formatRange } from "@/lib/dates";
import { contactHref, isPersonalFieldVisible } from "@/lib/personal-fields";
import { Run, normalizeUrl, parseRuns, toPlainText } from "@/lib/richtext/runs";
import {
  PAGE_DIMENSIONS,
  ResumeDocument,
  SectionNode,
} from "@/lib/schema/document";
import { isFieldVisible } from "@/lib/schema/field-visibility";
import { reconcileSections } from "@/lib/schema/migrate";
import { PersonalContactField, ResumeData, ResumeSettings } from "@/lib/types";
import { shortUrl } from "@/lib/utils";
import { readingOrder } from "./reading-order";

const FONT = "Calibri";
/** Half-points, as Word measures font size. */
const SIZE = { name: 40, title: 24, heading: 22, body: 21, meta: 19 };
/** 1px at 96dpi in twentieths of a point. */
const TWIP_PER_PX = 15;

const clean = (v: unknown) =>
  typeof v === "string" ? toPlainText(v).replace(/\s+/g, " ").trim() : "";

/**
 * A rich-text value as lines of runs, keeping bold, italics, underline and
 * links. Whitespace is collapsed and a typed bullet glyph at the start of a
 * line dropped, since Word draws its own.
 */
const richLines = (v: string | undefined): Run[][] => {
  const out: Run[][] = [[]];
  for (const r of parseRuns(v ?? "")) {
    r.text.split("\n").forEach((part, i) => {
      if (i > 0) out.push([]);
      if (part) out[out.length - 1].push({ ...r, text: part });
    });
  }
  return out
    .map((line) => {
      const tidy = line.map((r) => ({
        ...r,
        text: r.text.replace(/\s+/g, " "),
      }));
      if (tidy.length) {
        tidy[0].text = tidy[0].text.replace(/^\s*[•\-*◦▪]?\s*/, "");
        const last = tidy[tidy.length - 1];
        last.text = last.text.trimEnd();
      }
      return tidy.filter((r) => r.text.length > 0);
    })
    .filter((line) => line.length > 0);
};

const run = (
  text: string,
  opts: Partial<{
    bold: boolean;
    italics: boolean;
    underline: object;
    size: number;
    color: string;
  }> = {},
) => new TextRun({ text, font: FONT, size: opts.size ?? SIZE.body, ...opts });

export async function toDocxBlob(
  doc: ResumeDocument,
  data: ResumeData,
  settings: ResumeSettings,
): Promise<Blob> {
  const format = settings.dateFormat ?? DEFAULT_DATE_FORMAT;
  const page = PAGE_DIMENSIONS[doc.page.size];
  const margin = 0.7 * 1440; // 0.7in
  const contentWidth = page.width * TWIP_PER_PX - margin * 2;
  const accent = doc.theme.colors.accent.replace("#", "");

  type Inline = TextRun | ExternalHyperlink;

  /**
   * A clickable link. Word, like the PDF, needs a real hyperlink for the
   * reader to follow it; a URL in plain text is dead.
   */
  const link = (url: string, text: string, size = SIZE.body): Inline =>
    url
      ? new ExternalHyperlink({
          link: url,
          children: [run(text, { size, color: accent })],
        })
      : // A URL with a scheme we refuse to link prints as text.
        run(text, { size });

  const inline = (runs: Run[], size = SIZE.body): Inline[] =>
    runs.map((r) => {
      const marks = {
        size,
        bold: r.bold,
        italics: r.italic,
        ...(r.underline ? { underline: {} } : {}),
      };
      return r.link
        ? new ExternalHyperlink({
            link: r.link,
            children: [run(r.text, { ...marks, color: accent })],
          })
        : run(r.text, marks);
    });

  /** Left text with a right-aligned date on the same line. */
  const titleLine = (left: string, right: string, bold = true) =>
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: contentWidth }],
      spacing: { before: 120, after: 20 },
      keepNext: true,
      children: [
        run(left, { bold }),
        ...(right
          ? [run(`\t${right}`, { size: SIZE.meta, color: "555555" })]
          : []),
      ],
    });

  /** Secondary details joined by " · "; a `{ url }` part becomes a link. */
  const metaLine = (
    parts: (string | { url: string } | false | undefined)[],
  ) => {
    const shown = parts.filter(
      (p): p is string | { url: string } =>
        !!p && (typeof p === "string" || !!p.url),
    );
    if (!shown.length) return null;
    const meta = { italics: true, size: SIZE.meta, color: "444444" };
    return new Paragraph({
      spacing: { after: 40 },
      keepNext: true,
      children: shown.flatMap((p, i) => [
        ...(i > 0 ? [run(" · ", meta)] : []),
        typeof p === "string"
          ? run(p, meta)
          : link(normalizeUrl(p.url), shortUrl(p.url), SIZE.meta),
      ]),
    });
  };

  const bullet = (children: Inline[]) =>
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 20 },
      children,
    });

  const para = (children: Inline[]) =>
    new Paragraph({ spacing: { after: 60 }, children });

  const heading = (text: string) =>
    new Paragraph({
      spacing: { before: 240, after: 80 },
      keepNext: true,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 },
      },
      children: [
        run(text.toUpperCase(), {
          bold: true,
          size: SIZE.heading,
          color: accent,
        }),
      ],
    });

  const description = (text: string | undefined) => {
    const ls = richLines(text).map((line) => inline(line));
    // One sentence reads as a paragraph; several lines are bullet points.
    return ls.length > 1 ? ls.map(bullet) : ls.map(para);
  };

  const body = (node: SectionNode): Paragraph[] => {
    const v = (key: string) => isFieldVisible(node, key);
    const out: Paragraph[] = [];
    switch (node.type) {
      case "summary": {
        // One paragraph, as before, but keeping its formatting and links.
        const summary = richLines(data.personalInfo.summary).flatMap(
          (line, i) => (i > 0 ? [{ text: " " }, ...line] : line),
        );
        if (summary.length) out.push(para(inline(summary)));
        break;
      }
      case "experience":
        for (const e of data.experience) {
          out.push(
            titleLine(clean(e.title), v("date") ? formatRange(e, format) : ""),
          );
          const meta = metaLine([
            v("company") && clean(e.company),
            v("location") && clean(e.location),
          ]);
          if (meta) out.push(meta);
          if (v("description")) out.push(...description(e.description));
        }
        break;
      case "education":
        for (const e of data.education) {
          out.push(
            titleLine(clean(e.degree), v("date") ? formatRange(e, format) : ""),
          );
          const meta = metaLine([
            v("school") && clean(e.school),
            v("location") && clean(e.location),
          ]);
          if (meta) out.push(meta);
        }
        break;
      case "projects":
        for (const p of data.projects) {
          out.push(titleLine(clean(p.name), v("date") ? clean(p.date) : ""));
          const meta = metaLine([v("link") && { url: p.link }]);
          if (meta) out.push(meta);
          if (v("description")) out.push(...description(p.description));
        }
        break;
      case "skills": {
        const names = data.skills.map((s) => clean(s.name)).filter(Boolean);
        if (names.length) out.push(para([run(names.join(", "))]));
        break;
      }
      case "languages": {
        const items = data.languages
          .map((l) =>
            [clean(l.name), v("proficiency") && clean(l.proficiency)]
              .filter(Boolean)
              .join(" — "),
          )
          .filter(Boolean);
        if (items.length) out.push(para([run(items.join("  ·  "))]));
        break;
      }
      case "certifications":
        for (const c of data.certifications) {
          out.push(titleLine(clean(c.name), v("date") ? clean(c.date) : ""));
          const meta = metaLine([
            v("issuer") && clean(c.issuer),
            v("link") && { url: c.link ?? "" },
          ]);
          if (meta) out.push(meta);
        }
        break;
      case "strengths":
        for (const s of data.strengths) {
          const d = v("description") ? clean(s.description) : "";
          out.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                run(clean(s.title), { bold: true }),
                ...(d ? [run(` — ${d}`)] : []),
              ],
            }),
          );
        }
        break;
      case "socials":
        for (const s of data.socials) {
          if (!s.url) continue;
          out.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [
                run(`${clean(s.platform)}: `, { bold: true }),
                link(normalizeUrl(s.url), shortUrl(s.url)),
              ],
            }),
          );
        }
        break;
      case "custom": {
        const uuid = node.sourceId ?? node.id.replace(/^custom:/, "");
        const custom = data.customSections.find((c) => c.id === uuid);
        for (const item of custom?.items ?? []) {
          out.push(
            titleLine(clean(item.title), v("date") ? clean(item.date) : ""),
          );
          const meta = metaLine([
            v("subtitle") && clean(item.subtitle),
            v("link") && { url: item.link ?? "" },
          ]);
          if (meta) out.push(meta);
          if (v("description")) out.push(...description(item.description));
        }
        break;
      }
    }
    return out;
  };

  // ---------------------------------------------------------------- header
  const info = data.personalInfo;
  const header: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [run(clean(info.fullName), { bold: true, size: SIZE.name })],
    }),
  ];
  if (isPersonalFieldVisible(settings, "title") && clean(info.title)) {
    header.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [run(clean(info.title), { size: SIZE.title, color: accent })],
      }),
    );
  }
  const contactFields: PersonalContactField[] = [
    "email",
    "phone",
    "location",
    "website",
    "linkedin",
    "github",
    "twitter",
  ];
  const contactMeta = { size: SIZE.meta, color: "444444" };
  const contacts = contactFields
    .filter((f) => isPersonalFieldVisible(settings, f) && clean(info[f]))
    .map((f): Inline => {
      const value = clean(info[f]);
      const href = contactHref(f, value);
      return href
        ? link(
            href,
            f === "email" || f === "phone" ? value : shortUrl(value),
            SIZE.meta,
          )
        : run(value, contactMeta);
    });
  if (contacts.length) {
    header.push(
      new Paragraph({
        spacing: { after: 120 },
        children: contacts.flatMap((c, i) => [
          ...(i > 0 ? [run("  |  ", contactMeta)] : []),
          c,
        ]),
      }),
    );
  }

  // --------------------------------------------------------------- sections
  // Columns flattened to reading order: main column first, then sidebar.
  const sections = readingOrder(reconcileSections(doc, settings));

  const children: Paragraph[] = [...header];
  for (const node of sections) {
    const content = body(node);
    if (!content.length) continue;
    children.push(heading(clean(node.title)), ...content);
  }

  const document = new Document({
    creator: clean(info.fullName),
    title: `${clean(info.fullName)} — Resume`,
    styles: {
      default: { document: { run: { font: FONT, size: SIZE.body } } },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: page.width * TWIP_PER_PX,
              height: page.height * TWIP_PER_PX,
            },
            margin: {
              top: margin,
              right: margin,
              bottom: margin,
              left: margin,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(document);
}
