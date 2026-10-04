/**
 * v1 (`ResumeSettings` with template + leftColumn/rightColumn) → v2
 * (`ResumeDocument`).
 *
 * Lossless for everything v1 could express: template choice becomes a preset,
 * accent colour and page size carry over, per-section visibility / rename /
 * order / pageBreakBefore carry over, and `styleOverrides` is left untouched so
 * the existing path cascade keeps working on top of the schema.
 */

import {
  PersonalContactField,
  ResumeSettings,
  SectionConfig,
} from "@/lib/types";
import {
  ColumnId,
  DOCUMENT_VERSION,
  DocumentPreset,
  Placement,
  ResumeDocument,
  SectionNode,
  SectionType,
} from "./document";
import {
  DEFAULT_ITEM_LAYOUT,
  defaultFields,
  defaultItemLayout,
} from "./defaults";
import { buildPreset } from "./presets";

const BUILTIN_TYPES: SectionType[] = [
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "languages",
  "certifications",
  "strengths",
  "socials",
];

export const isCustomId = (id: string) => id.startsWith("custom:");

export function sectionTypeOf(id: string): SectionType {
  if (isCustomId(id)) return "custom";
  return (BUILTIN_TYPES as string[]).includes(id)
    ? (id as SectionType)
    : "custom";
}

/**
 * Creative rendered `rightColumn` in the visually-left sidebar. Normalise so
 * `left` always means left; every other template already matched.
 */
function normalizeColumns(
  template: string,
  left: SectionConfig[],
  right: SectionConfig[],
): { left: SectionConfig[]; right: SectionConfig[] } {
  if (template === "creative") return { left: right, right: left };
  return { left, right };
}

function makeSection(
  config: SectionConfig,
  column: Placement,
  order: number,
  preset: DocumentPreset,
): SectionNode {
  const type = sectionTypeOf(config.id);
  const styleKey: ColumnId | "full" = column === "full" ? "full" : column;
  return {
    id: config.id,
    type,
    sourceId: isCustomId(config.id)
      ? config.id.slice("custom:".length)
      : undefined,
    title: config.name,
    visible: config.visible !== false,
    placement: { column, page: "auto", order },
    flow: {
      keepTogether: false,
      breakBefore: config.pageBreakBefore === true,
      repeatHeading: true,
    },
    style: structuredClone(preset.sectionStyle[styleKey]),
    items: {
      ...defaultItemLayout,
      ...(DEFAULT_ITEM_LAYOUT[type] ?? {}),
      ...(preset.itemLayout?.[type] ?? {}),
    },
    fields: defaultFields(type),
  };
}

export function documentFromSettings(settings: ResumeSettings): ResumeDocument {
  const templateId = settings.template || "classic";
  const accent = settings.themeColor || "#23405c";
  const preset = buildPreset(templateId, accent);

  const { left, right } = normalizeColumns(
    templateId,
    settings.leftColumn || [],
    settings.rightColumn || [],
  );

  const singleColumn = preset.layout.columns === 1;
  const sections: SectionNode[] = [];
  let order = 0;

  for (const config of left) {
    sections.push(
      makeSection(config, singleColumn ? "full" : "left", order++, preset),
    );
  }
  for (const config of right) {
    sections.push(
      makeSection(config, singleColumn ? "full" : "right", order++, preset),
    );
  }

  // Carry v1's header settings into the schema.
  const header = structuredClone(preset.layout.header);
  header.photo.visible = settings.showPhoto !== false;
  if (settings.photoStyle) header.photo.shape = settings.photoStyle;
  header.contacts.showIcons = settings.showContactIcons !== false;

  return {
    version: DOCUMENT_VERSION,
    preset: templateId,
    page: { ...preset.page, size: settings.documentSize || "A4" },
    theme: preset.theme,
    layout: { ...preset.layout, header },
    sections,
  };
}

/**
 * Reconcile the document's section list against the column arrays.
 *
 * During the migration `settings.leftColumn`/`rightColumn` remain authoritative
 * for which sections exist, their order, column, visibility, title and page
 * break — every existing action already maintains them. `document.sections`
 * owns styling, item flow and field specs. This pure step joins the two, adding
 * nodes for new sections and dropping nodes for deleted ones, so the two can
 * never drift. When drag-and-drop lands (Phase 5) placement moves into the
 * document and this function reverses direction.
 */
export function reconcileSections(
  doc: ResumeDocument,
  settings: ResumeSettings,
): ResumeDocument {
  const preset = buildPreset(doc.preset, doc.theme.colors.accent);
  const { left, right } = normalizeColumns(
    doc.preset,
    settings.leftColumn || [],
    settings.rightColumn || [],
  );
  const byId = new Map(doc.sections.map((s) => [s.id, s]));

  // Column membership in `settings` now only seeds sections the document has
  // never seen; afterwards placement is the document's to own, so a drag is
  // not undone on the next render.
  const seed: { config: SectionConfig; column: ColumnId }[] = [
    ...left.map((config) => ({ config, column: "left" as ColumnId })),
    ...right.map((config) => ({ config, column: "right" as ColumnId })),
  ];

  let maxOrder = doc.sections.reduce(
    (max, s) => Math.max(max, s.placement.order),
    -1,
  );

  const sections = seed.map(({ config, column }) => {
    const existing = byId.get(config.id);
    const base = existing ?? makeSection(config, column, ++maxOrder, preset);
    return {
      ...base,
      title: config.name,
      visible: config.visible !== false,
      flow: { ...base.flow, breakBefore: config.pageBreakBefore === true },
    };
  });

  const same =
    sections.length === doc.sections.length &&
    sections.every((s, i) => {
      const prev = doc.sections[i];
      return (
        prev &&
        prev.id === s.id &&
        prev.title === s.title &&
        prev.visible === s.visible &&
        prev.flow.breakBefore === s.flow.breakBefore
      );
    });

  return same ? doc : { ...doc, sections };
}

/** Field visibility lived on settings in v1; fold it into the header spec. */
export function personalVisibilityFromSettings(
  settings: ResumeSettings,
): Partial<Record<PersonalContactField, boolean>> {
  return settings.personalFieldVisibility ?? {};
}

/**
 * Re-seed an existing document from a different preset, keeping the user's
 * content decisions (which sections exist, their order, visibility, renames,
 * page breaks) and replacing only the presentation.
 */
export function applyPreset(
  doc: ResumeDocument,
  presetId: string,
  accent = doc.theme.colors.accent,
): ResumeDocument {
  const preset = buildPreset(presetId, accent);
  const singleColumn = preset.layout.columns === 1;

  const sections = doc.sections.map((section) => {
    const target: Placement = singleColumn
      ? "full"
      : (preset.defaultPlacement[section.type] ?? section.placement.column);
    const styleKey: ColumnId | "full" = target === "full" ? "full" : target;
    return {
      ...section,
      placement: {
        ...section.placement,
        column: target,
        page: "auto" as const,
      },
      style: structuredClone(preset.sectionStyle[styleKey]),
      items: {
        ...section.items,
        ...(preset.itemLayout?.[section.type] ?? {}),
      },
    };
  });

  const header = structuredClone(preset.layout.header);
  header.photo.visible = doc.layout.header.photo.visible;
  header.photo.shape = doc.layout.header.photo.shape;
  header.contacts.showIcons = doc.layout.header.contacts.showIcons;

  return {
    ...doc,
    preset: presetId,
    page: { ...preset.page, size: doc.page.size },
    // A template restyles layout and colour; the user's type choices (font
    // pair, text size, line spacing) are theirs and survive the switch.
    theme: {
      ...preset.theme,
      fonts: structuredClone(doc.theme.fonts),
      scale: { ...doc.theme.scale },
    },
    layout: { ...preset.layout, header },
    sections,
  };
}
