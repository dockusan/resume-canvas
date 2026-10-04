/**
 * Neutral defaults + small builders. Presets describe only what makes them
 * distinctive; everything they omit comes from here, so a preset file stays
 * readable and adding a schema field doesn't mean touching all six of them.
 */

import {
  BorderSpec,
  Box,
  BoxStyle,
  Fill,
  FontSpec,
  HeadingStyle,
  ItemLayout,
  MarkerStyle,
  SectionStyle,
  SeparatorStyle,
  Sides,
  Theme,
} from "./document";

export const box = (
  top: number,
  right = top,
  bottom = top,
  left = right,
): Box => ({ top, right, bottom, left });

export const NO_BOX = box(0);

export const sides = (
  top = false,
  right = false,
  bottom = false,
  left = false,
): Sides => ({ top, right, bottom, left });

export const solid = (color: string): Fill => ({ type: "solid", color });
export const noFill: Fill = { type: "none" };
export const gradient = (from: string, to: string, angle = 90): Fill => ({
  type: "gradient",
  from,
  to,
  angle,
});

export const border = (
  color: string,
  width = 1,
  where: Partial<Sides> = { bottom: true },
  style: BorderSpec["style"] = "solid",
): BorderSpec => ({
  width,
  style,
  color,
  sides: { top: false, right: false, bottom: false, left: false, ...where },
});

export const font = (patch: Partial<FontSpec> = {}): FontSpec => ({
  family: "inherit",
  weight: 400,
  letterSpacing: 0,
  lineHeight: 1.45,
  transform: "none",
  ...patch,
});

/** Hairline and text colours for content sitting on a dark filled column. */
export const ON_FILL_LINE = "rgba(255,255,255,0.2)";
export const ON_FILL_TEXT = "rgba(255,255,255,0.9)";

export const DEFAULT_THEME: Theme = {
  colors: {
    accent: "#23405c",
    text: "#3e3e3e",
    muted: "#6b7280",
    heading: "#3e3e3e",
    surface: "#ffffff",
    onFill: "#ffffff",
    border: "#e5e7eb",
  },
  fonts: {
    heading: font({ weight: 600, letterSpacing: 0.6, transform: "uppercase" }),
    body: font(),
  },
  scale: { base: 13.3, ratio: 1.12, contrast: 1 },
  radius: { sm: 4, md: 8, lg: 12 },
  spacing: { section: 1, item: 1, bullet: 1 },
};

export const emptyBox = (patch: Partial<BoxStyle> = {}): BoxStyle => ({
  padding: NO_BOX,
  background: noFill,
  border: null,
  radius: 0,
  shadow: null,
  gap: 0,
  ...patch,
});

export const noSeparator: SeparatorStyle = {
  kind: "none",
  color: "#e5e7eb",
  thickness: 1,
  spacing: 0,
};

export const noMarker: MarkerStyle = {
  kind: "none",
  color: "#d1d5db",
  size: 8,
  offset: -5,
  rail: null,
};

export const defaultItemLayout: ItemLayout = {
  direction: "column",
  wrap: false,
  gap: 12,
  columns: null,
  align: "stretch",
  justify: "start",
};

export const heading = (patch: Partial<HeadingStyle> = {}): HeadingStyle => ({
  variant: "underline",
  font: DEFAULT_THEME.fonts.heading,
  step: 2,
  color: DEFAULT_THEME.colors.heading,
  background: noFill,
  border: border(DEFAULT_THEME.colors.border),
  padding: box(0, 0, 4, 0),
  radius: 0,
  align: "left",
  marginBottom: 8,
  icon: null,
  ...patch,
});

export const sectionStyle = (
  presetId: string,
  patch: Partial<SectionStyle> = {},
): SectionStyle => ({
  preset: presetId,
  heading: heading(),
  container: emptyBox({ padding: box(0, 0, 12, 0) }),
  itemBox: emptyBox(),
  separator: noSeparator,
  marker: noMarker,
  ...patch,
});

/**
 * Item flow per section type. Skills and socials are chip/row shaped; the
 * narrative sections stack. Presets can override any of these.
 */
export const DEFAULT_ITEM_LAYOUT: Record<string, Partial<ItemLayout>> = {
  summary: { direction: "column", gap: 0 },
  experience: { direction: "column", gap: 14 },
  education: { direction: "column", gap: 10 },
  projects: { direction: "column", gap: 12 },
  strengths: { direction: "column", gap: 10 },
  certifications: { direction: "column", gap: 10 },
  languages: { direction: "column", gap: 8 },
  socials: { direction: "row", wrap: true, gap: 12 },
  skills: { direction: "row", wrap: true, gap: 6 },
  custom: { direction: "column", gap: 12 },
};

/**
 * Which fields each section type exposes, in order, with their default icon
 * and type-scale step. This is the single source of truth for the field
 * show/hide UI and for what the renderers draw.
 */
export interface FieldDef {
  key: string;
  label: string;
  icon?: string;
  step?: number;
  /** Not hideable (removing it would leave the item unidentifiable). */
  required?: boolean;
}

export const SECTION_FIELDS: Record<string, FieldDef[]> = {
  summary: [{ key: "text", label: "Text", required: true }],
  experience: [
    { key: "title", label: "Job title", step: 1, required: true },
    { key: "company", label: "Company" },
    { key: "location", label: "Location" },
    { key: "date", label: "Dates", step: -1 },
    { key: "description", label: "Description" },
  ],
  education: [
    { key: "degree", label: "Degree", step: 1, required: true },
    { key: "school", label: "School" },
    { key: "location", label: "Location" },
    { key: "date", label: "Dates", step: -1 },
  ],
  projects: [
    { key: "name", label: "Name", step: 1, required: true },
    { key: "link", label: "Link", icon: "ExternalLink" },
    { key: "date", label: "Date", step: -1 },
    { key: "description", label: "Description" },
  ],
  skills: [{ key: "name", label: "Skill", required: true }],
  languages: [
    { key: "name", label: "Language", required: true },
    { key: "proficiency", label: "Proficiency", step: -1 },
    { key: "meter", label: "Level meter" },
  ],
  certifications: [
    { key: "name", label: "Name", required: true },
    { key: "issuer", label: "Issuer" },
    { key: "date", label: "Date", step: -1 },
    { key: "link", label: "Link", icon: "ExternalLink" },
    { key: "description", label: "Description", step: -1 },
  ],
  strengths: [
    { key: "icon", label: "Icon" },
    { key: "title", label: "Title", required: true },
    { key: "description", label: "Description" },
  ],
  socials: [
    { key: "icon", label: "Icon" },
    { key: "platform", label: "Platform", required: true },
    { key: "username", label: "Username", step: -1 },
    { key: "link", label: "Link", icon: "ExternalLink" },
  ],
  custom: [
    { key: "icon", label: "Icon" },
    { key: "title", label: "Title", step: 1, required: true },
    { key: "subtitle", label: "Subtitle" },
    { key: "date", label: "Date", step: -1 },
    { key: "link", label: "Link", icon: "ExternalLink" },
    { key: "description", label: "Description" },
  ],
};

export function defaultFields(type: string) {
  const defs = SECTION_FIELDS[type] ?? [];
  return Object.fromEntries(
    defs.map((f, i) => [
      f.key,
      {
        visible: true,
        icon: f.icon ?? null,
        order: i,
        step: f.step ?? 0,
        color: null,
        weight: null,
      },
    ]),
  );
}
