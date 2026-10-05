/**
 * Resume document schema (v2).
 *
 * Describes *presentation* only — page geometry, theme, column layout, and how
 * each section is placed and styled. The content itself (`ResumeData`:
 * personalInfo, experience, education, …) is unchanged and lives alongside it.
 *
 * Templates are not code in this model: a template is a `DocumentPreset`, i.e.
 * plain data seeding page + theme + layout + section defaults. Users can change
 * anything afterwards, so there is no "you are on template X" lock-in.
 */

import { ResumeData } from "@/lib/types";

export const DOCUMENT_VERSION = 2;

// ---------------------------------------------------------------- primitives

export interface Box {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Sides {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export type Fill =
  | { type: "none" }
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number };

export interface BorderSpec {
  width: number;
  style: "solid" | "dashed" | "dotted";
  color: string;
  sides: Sides;
}

export interface BoxStyle {
  padding: Box;
  background: Fill;
  border: BorderSpec | null;
  radius: number;
  /** CSS box-shadow, or null. Only reachable now that export is DOM-rendered. */
  shadow: string | null;
  /** Gap between the box's children. */
  gap: number;
}

/** Rule drawn *between* items, not around them. */
export interface SeparatorStyle {
  kind: "none" | "line" | "dashed" | "dotted" | "space";
  color: string;
  thickness: number;
  /** Space above and below the rule. */
  spacing: number;
}

/** Timeline dot / bar / bullet glyph rendered at the leading edge of an item. */
export interface MarkerStyle {
  kind: "none" | "dot" | "bar" | "square" | "ring";
  color: string;
  size: number;
  /** Horizontal offset from the item's leading edge, in px. */
  offset: number;
  /** Continuous rail drawn behind the markers (the "timeline"). */
  rail: { enabled: boolean; color: string; width: number } | null;
}

export interface FontSpec {
  family: string;
  weight: number;
  letterSpacing: number;
  lineHeight: number;
  transform: "none" | "uppercase" | "lowercase" | "capitalize";
}

// --------------------------------------------------------------------- page

export type PageSize = "A4" | "Letter";

export interface PageSpec {
  size: PageSize;
  /** Page margins in px at 96dpi (the unit the whole schema works in). */
  margin: Box;
  background: Fill;
}

/** CSS pixels at 96dpi. A4 = 210×297mm, Letter = 8.5×11in. */
export const PAGE_DIMENSIONS: Record<
  PageSize,
  { width: number; height: number }
> = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

// -------------------------------------------------------------------- theme

export interface Theme {
  colors: {
    accent: string;
    text: string;
    muted: string;
    heading: string;
    surface: string;
    /** Applied to sections sitting in a filled column. */
    onFill: string;
    border: string;
  };
  fonts: {
    heading: FontSpec;
    body: FontSpec;
  };
  /**
   * `base` is the body size in px. Every other size is a named step on a
   * fixed ladder (see TYPE_LADDER), so text size S/M/L/XL moves the whole
   * hierarchy together. `contrast` stretches or flattens the ladder: 1 is
   * the designed hierarchy, below 1 brings headings closer to body text.
   * `ratio` is the retired geometric ratio, kept only so old saves parse.
   */
  scale: {
    base: number;
    ratio: number;
    contrast?: number;
  };
  radius: { sm: number; md: number; lg: number };
  /**
   * Vertical rhythm multipliers applied at render time on top of each
   * section's own values: 1 is as designed, <1 tighter, >1 airier.
   */
  spacing: { section: number; item: number; bullet: number };
}

/**
 * Size multipliers for each step of the type scale, relative to body text.
 *
 *  -2 fine print · -1 meta (dates, places, contacts) · 0 body
 *   1 item title · 2 section heading / job title line · 3 large heading
 *   5 name · 6 display name
 *
 * A fixed ladder rather than `ratio ** step`: a geometric ratio made the name
 * (step 5) barely larger than headings at low ratios and enormous at high
 * ones, and gave section headings and item titles the same size.
 */
export const TYPE_LADDER: Record<number, number> = {
  [-2]: 0.8,
  [-1]: 0.88,
  0: 1,
  1: 1.1,
  2: 1.25,
  3: 1.42,
  4: 1.75,
  5: 2.3,
  6: 2.75,
};

function ladderAt(step: number): number {
  const clamped = Math.max(-2, Math.min(6, step));
  const lo = Math.floor(clamped);
  const hi = Math.ceil(clamped);
  if (lo === hi) return TYPE_LADDER[lo];
  const t = clamped - lo;
  return TYPE_LADDER[lo] * (1 - t) + TYPE_LADDER[hi] * t;
}

/** Resolve a type-scale step to a px size. step 0 = body, 2 = heading. */
export function fontSizeAt(theme: Theme, step: number): number {
  const contrast = theme.scale.contrast ?? 1;
  const factor = 1 + (ladderAt(step) - 1) * contrast;
  return Math.round(theme.scale.base * factor * 100) / 100;
}

/** Spacing multipliers, tolerant of documents saved before they existed. */
export function spacingOf(theme: Theme): Theme["spacing"] {
  const s = theme.spacing as Partial<Theme["spacing"]> | undefined;
  return {
    section: s?.section ?? 1,
    item: s?.item ?? 1,
    bullet: s?.bullet ?? 1,
  };
}

// ------------------------------------------------------------------- layout

export type ColumnId = "left" | "right";
export type Placement = ColumnId | "full";

export interface PhotoSpec {
  visible: boolean;
  size: number;
  shape: "square" | "rounded" | "circle";
  border: BorderSpec | null;
  shadow: string | null;
  /** Decorative rotation in degrees (Creative preset uses -2). */
  rotate: number;
  /**
   * Where the photo sits. `header` places it beside the name; a column id
   * pins it to the top of that column instead — which is how Classic keeps
   * its portrait in the sidebar while the name block stays in the main column.
   */
  slot: "header" | ColumnId;
  align: "start" | "center" | "end";
}

export interface HeaderSpec {
  /** `band` spans both columns; otherwise the header sits inside one column. */
  placement: "band" | ColumnId;
  /** Photo beside the name block, or stacked above it. */
  direction: "row" | "column";
  align: "left" | "center" | "right";
  background: Fill;
  padding: Box;
  border: BorderSpec | null;
  photo: PhotoSpec;
  /** Photo before or after the name block. */
  photoPosition: "start" | "end";
  /** Type-scale steps for the name, the job title and the contact line. */
  type: { name: number; title: number; contact: number };
  contacts: {
    /**
     * `below` stacks contacts under the name; `beside` puts them in their own
     * column on the opposite side of the header, which is what fills the empty
     * half of a wide header band.
     */
    placement: "below" | "beside";
    direction: "row" | "column";
    align: "start" | "center" | "end";
    gap: number;
    showIcons: boolean;
    iconPosition: "before" | "after";
    /** Divider drawn between contact entries. */
    separator: SeparatorStyle;
  };
}

/**
 * A decorative bar pinned to one edge of the page or of a column — Classic's
 * darkened sidebar strip, Executive's 8px accent rule, Creative's gradient.
 * Modelling these as data is what lets those three templates survive the move
 * off hardcoded JSX without losing their signature detail.
 */
export interface Decoration {
  target: "page" | ColumnId;
  edge: "top" | "right" | "bottom" | "left";
  size: number;
  fill: Fill;
}

export interface LayoutSpec {
  columns: 1 | 2;
  /** Fraction of the content width taken by the LEFT column (0.2–0.8). */
  ratio: number;
  gap: number;
  /** Column backgrounds, painted full-bleed to the page edge on every page. */
  fills: { left: Fill; right: Fill };
  /** Padding inside each column, on top of the page margin. */
  padding: { left: Box; right: Box };
  header: HeaderSpec;
  decorations: Decoration[];
}

// ------------------------------------------------------------------ section

export type SectionType =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "languages"
  | "certifications"
  | "strengths"
  | "socials"
  | "custom";

export interface HeadingStyle {
  /** Named shape; `heading` overrides refine it. */
  variant: "plain" | "underline" | "pill" | "bar" | "boxed";
  font: FontSpec;
  /** Type-scale step relative to body text. */
  step: number;
  color: string;
  background: Fill;
  border: BorderSpec | null;
  padding: Box;
  radius: number;
  align: "left" | "center" | "right";
  marginBottom: number;
  /** Renders the section icon next to the title when set. */
  icon: string | null;
}

export interface SectionStyle {
  preset: string;
  heading: HeadingStyle;
  container: BoxStyle;
  itemBox: BoxStyle;
  separator: SeparatorStyle;
  marker: MarkerStyle;
}

export interface ItemLayout {
  direction: "row" | "column";
  wrap: boolean;
  gap: number;
  /** When set, items lay out on a fixed grid instead of flex. */
  columns: number | null;
  align: "start" | "center" | "end" | "stretch";
  justify: "start" | "center" | "end" | "between";
  /**
   * Where an entry's dates sit. "auto" puts them on their own line under the
   * entry when the section is in a narrow column (a sidebar), where a
   * right-aligned date would crowd the title.
   */
  datePosition?: "auto" | "beside" | "below";
}

export interface FieldSpec {
  visible: boolean;
  /** lucide icon name; null means no icon. */
  icon: string | null;
  order: number;
  /** Type-scale step relative to body text. */
  step: number;
  color: string | null;
  weight: number | null;
}

export interface SectionFlow {
  /** Never split this section across a page boundary. */
  keepTogether: boolean;
  /** Force the section to start at the top of a new page. */
  breakBefore: boolean;
  /** Repeat the heading (as "Title (cont.)") on continuation pages. */
  repeatHeading: boolean;
}

export interface SectionNode {
  id: string;
  type: SectionType;
  /** For `custom` sections, the uuid keying into ResumeData.customSections. */
  sourceId?: string;
  title: string;
  visible: boolean;
  placement: {
    column: Placement;
    /** Pinned page index (0-based), or "auto" to flow naturally. */
    page: number | "auto";
    order: number;
  };
  flow: SectionFlow;
  style: SectionStyle;
  items: ItemLayout;
  fields: Record<string, FieldSpec>;
}

// ----------------------------------------------------------------- document

export interface ResumeDocument {
  version: typeof DOCUMENT_VERSION;
  /** Id of the preset this document started from, for reference only. */
  preset: string;
  page: PageSpec;
  theme: Theme;
  layout: LayoutSpec;
  sections: SectionNode[];
}

/** A template: plain data that seeds a document. */
export interface DocumentPreset {
  id: string;
  name: string;
  description: string;
  page: Omit<PageSpec, "size">;
  theme: Theme;
  layout: LayoutSpec;
  /** Per-column section style, mirroring the old left/right config split. */
  sectionStyle: Record<ColumnId | "full", SectionStyle>;
  /** Which column each section type defaults into. */
  defaultPlacement: Partial<Record<SectionType, Placement>>;
  itemLayout?: Partial<Record<SectionType, Partial<ItemLayout>>>;
}

export type { ResumeData };
