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
import { isPersonalFieldVisible } from "@/lib/personal-fields";
import { toPlainText } from "@/lib/richtext/runs";
import {
  PAGE_DIMENSIONS,
  ResumeDocument,
  SectionNode,
} from "@/lib/schema/document";
import { isFieldVisible } from "@/lib/schema/field-visibility";
import { reconcileSections } from "@/lib/schema/migrate";
import { PersonalContactField, ResumeData, ResumeSettings } from "@/lib/types";
import { shortUrl } from "@/lib/utils";

const FONT = "Calibri";
/** Half-points, as Word measures font size. */
const SIZE = { name: 40, title: 24, heading: 22, body: 21, meta: 19 };
/** 1px at 96dpi in twentieths of a point. */
const TWIP_PER_PX = 15;

const clean = (v: unknown) =>
  typeof v === "string" ? toPlainText(v).replace(/\s+/g, " ").trim() : "";

const lines = (v: string | undefined) =>
  toPlainText(v ?? "")
    .split("\n")
    .map((l) =>
      l
        .replace(/^\s*[•\-*◦▪]\s*/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

const run = (
  text: string,
  opts: Partial<{
    bold: boolean;
    italics: boolean;
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

  const metaLine = (text: string) =>
    new Paragraph({
      spacing: { after: 40 },
      keepNext: true,
      children: [
        run(text, { italics: true, size: SIZE.meta, color: "444444" }),
      ],
    });

  const bullet = (text: string) =>
    new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 20 },
      children: [run(text)],
    });

  const para = (text: string) =>
    new Paragraph({ spacing: { after: 60 }, children: [run(text)] });

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
    const ls = lines(text);
    // One sentence reads as a paragraph; several lines are bullet points.
    return ls.length > 1 ? ls.map(bullet) : ls.map(para);
  };

  const body = (node: SectionNode): Paragraph[] => {
    const v = (key: string) => isFieldVisible(node, key);
    const out: Paragraph[] = [];
    switch (node.type) {
      case "summary":
        if (clean(data.personalInfo.summary))
          out.push(para(clean(data.personalInfo.summary)));
        break;
      case "experience":
        for (const e of data.experience) {
          out.push(
            titleLine(clean(e.title), v("date") ? formatRange(e, format) : ""),
          );
          const meta = [
            v("company") && clean(e.company),
            v("location") && clean(e.location),
          ]
            .filter(Boolean)
            .join(" · ");
          if (meta) out.push(metaLine(meta));
          if (v("description"))
            out.push(...description(e.description).map((p) => p));
        }
        break;
      case "education":
        for (const e of data.education) {
          out.push(
            titleLine(clean(e.degree), v("date") ? formatRange(e, format) : ""),
          );
          const meta = [
            v("school") && clean(e.school),
            v("location") && clean(e.location),
          ]
            .filter(Boolean)
            .join(" · ");
          if (meta) out.push(metaLine(meta));
        }
        break;
      case "projects":
        for (const p of data.projects) {
          out.push(titleLine(clean(p.name), v("date") ? clean(p.date) : ""));
          if (v("link") && p.link) out.push(metaLine(shortUrl(p.link)));
          if (v("description")) out.push(...description(p.description));
        }
        break;
      case "skills": {
        const names = data.skills.map((s) => clean(s.name)).filter(Boolean);
        if (names.length) out.push(para(names.join(", ")));
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
        if (items.length) out.push(para(items.join("  ·  ")));
        break;
      }
      case "certifications":
        for (const c of data.certifications) {
          out.push(titleLine(clean(c.name), v("date") ? clean(c.date) : ""));
          const meta = [
            v("issuer") && clean(c.issuer),
            v("link") && c.link && shortUrl(c.link),
          ]
            .filter(Boolean)
            .join(" · ");
          if (meta) out.push(metaLine(meta));
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
                new ExternalHyperlink({
                  link: s.url,
                  children: [run(shortUrl(s.url), { color: accent })],
                }),
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
          const meta = [
            v("subtitle") && clean(item.subtitle),
            v("link") && item.link && shortUrl(item.link),
          ]
            .filter(Boolean)
            .join(" · ");
          if (meta) out.push(metaLine(meta));
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
  const contacts = contactFields
    .filter((f) => isPersonalFieldVisible(settings, f) && clean(info[f]))
    .map((f) =>
      ["website", "linkedin", "github", "twitter"].includes(f)
        ? shortUrl(clean(info[f]))
        : clean(info[f]),
    );
  if (contacts.length) {
    header.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          run(contacts.join("  |  "), { size: SIZE.meta, color: "444444" }),
        ],
      }),
    );
  }

  // --------------------------------------------------------------- sections
  // Columns flattened to reading order: main column first, then sidebar.
  const order = { left: 0, full: 0, right: 1 } as const;
  const sections = reconcileSections(doc, settings)
    .sections.filter((s) => s.visible)
    .sort(
      (a, b) =>
        order[a.placement.column] - order[b.placement.column] ||
        a.placement.order - b.placement.order,
    );

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
