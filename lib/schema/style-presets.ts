/**
 * Curated, named looks.
 *
 * The schema is deliberately fine-grained — border sides, pixel offsets, radii
 * — but nobody choosing a resume style wants to set six values to get "pill
 * heading". These presets bundle those values behind one decision each, and
 * the raw controls stay available underneath for anyone who wants them.
 */

import {
  BoxStyle,
  HeadingStyle,
  ItemLayout,
  MarkerStyle,
  SectionStyle,
  SeparatorStyle,
  Theme,
} from "./document";
import { border, box, noFill, solid } from "./defaults";

export interface Look<T> {
  id: string;
  name: string;
  build: (theme: Theme) => T;
  /** True when the current value came from this look. */
  matches: (current: T) => boolean;
}

// ------------------------------------------------------------------ headings

export const HEADING_LOOKS: Look<Partial<HeadingStyle>>[] = [
  {
    id: "plain",
    name: "Plain",
    build: () => ({
      variant: "plain",
      border: null,
      background: noFill,
      padding: box(0),
      radius: 0,
    }),
    matches: (h) => h.variant === "plain",
  },
  {
    id: "underline",
    name: "Rule",
    build: (theme) => ({
      variant: "underline",
      border: border(theme.colors.border, 1),
      background: noFill,
      padding: box(0, 0, 4, 0),
      radius: 0,
    }),
    matches: (h) => h.variant === "underline" && (h.border?.width ?? 0) <= 1,
  },
  {
    id: "accent-rule",
    name: "Accent rule",
    build: (theme) => ({
      variant: "underline",
      border: border(theme.colors.accent, 2),
      background: noFill,
      padding: box(0, 0, 4, 0),
      radius: 0,
    }),
    matches: (h) => h.variant === "underline" && (h.border?.width ?? 0) >= 2,
  },
  {
    id: "side-rule",
    name: "Side rule",
    build: (theme) => ({
      variant: "plain",
      border: border(theme.colors.accent, 3, { left: true }),
      background: noFill,
      padding: box(0, 0, 0, 8),
      radius: 0,
    }),
    matches: (h) => !!h.border?.sides.left && !h.border?.sides.bottom,
  },
  {
    id: "pill",
    name: "Pill",
    build: (theme) => ({
      variant: "pill",
      border: null,
      background: solid(theme.colors.accent),
      color: theme.colors.onFill,
      padding: box(4, 12),
      radius: 999,
    }),
    matches: (h) => h.variant === "pill",
  },
  {
    id: "boxed",
    name: "Boxed",
    build: (theme) => ({
      variant: "boxed",
      border: border(theme.colors.border, 1, {
        top: true,
        right: true,
        bottom: true,
        left: true,
      }),
      background: noFill,
      padding: box(4, 10),
      radius: 4,
    }),
    matches: (h) => h.variant === "boxed",
  },
];

// ------------------------------------------------------------------ timeline

export interface TimelineValue {
  marker: MarkerStyle;
  itemBox: Pick<BoxStyle, "padding">;
}

export const TIMELINE_LOOKS: Look<TimelineValue>[] = [
  {
    id: "none",
    name: "None",
    build: () => ({
      marker: {
        kind: "none",
        color: "#d1d5db",
        size: 8,
        offset: -5,
        rail: null,
      },
      itemBox: { padding: box(0) },
    }),
    matches: (v) => v.marker.kind === "none" && !v.marker.rail?.enabled,
  },
  {
    id: "rail",
    name: "Line",
    build: (theme) => ({
      marker: {
        kind: "none",
        color: theme.colors.border,
        size: 0,
        offset: 0,
        rail: { enabled: true, color: theme.colors.border, width: 2 },
      },
      itemBox: { padding: box(0, 0, 0, 12) },
    }),
    matches: (v) => v.marker.kind === "none" && !!v.marker.rail?.enabled,
  },
  {
    id: "dots",
    name: "Dots",
    build: (theme) => ({
      marker: {
        kind: "dot",
        color: theme.colors.accent,
        size: 8,
        offset: -4,
        rail: null,
      },
      itemBox: { padding: box(0, 0, 0, 12) },
    }),
    matches: (v) => v.marker.kind !== "none" && !v.marker.rail?.enabled,
  },
  {
    id: "dots-rail",
    name: "Timeline",
    build: (theme) => ({
      marker: {
        kind: "dot",
        color: theme.colors.accent,
        size: 8,
        offset: -5,
        rail: { enabled: true, color: `${theme.colors.accent}33`, width: 2 },
      },
      itemBox: { padding: box(0, 0, 0, 12) },
    }),
    matches: (v) => v.marker.kind !== "none" && !!v.marker.rail?.enabled,
  },
];

// ----------------------------------------------------------------- dividers

export const DIVIDER_LOOKS: Look<SeparatorStyle>[] = [
  {
    id: "none",
    name: "None",
    build: () => ({ kind: "none", color: "#e5e7eb", thickness: 1, spacing: 0 }),
    matches: (s) => s.kind === "none",
  },
  {
    id: "line",
    name: "Line",
    build: (theme) => ({
      kind: "line",
      color: theme.colors.border,
      thickness: 1,
      spacing: 8,
    }),
    matches: (s) => s.kind === "line",
  },
  {
    id: "dashed",
    name: "Dashed",
    build: (theme) => ({
      kind: "dashed",
      color: theme.colors.border,
      thickness: 1,
      spacing: 8,
    }),
    matches: (s) => s.kind === "dashed",
  },
  {
    id: "space",
    name: "Space",
    build: () => ({
      kind: "space",
      color: "#e5e7eb",
      thickness: 0,
      spacing: 10,
    }),
    matches: (s) => s.kind === "space",
  },
];

// ------------------------------------------------------------------ density

export interface DensityValue {
  gap: number;
  bottom: number;
}

export const DENSITY_LOOKS: Look<DensityValue>[] = [
  {
    id: "compact",
    name: "Compact",
    build: () => ({ gap: 6, bottom: 8 }),
    matches: (d) => d.gap <= 8,
  },
  {
    id: "normal",
    name: "Normal",
    build: () => ({ gap: 12, bottom: 12 }),
    matches: (d) => d.gap > 8 && d.gap <= 16,
  },
  {
    id: "relaxed",
    name: "Relaxed",
    build: () => ({ gap: 20, bottom: 18 }),
    matches: (d) => d.gap > 16,
  },
];

// ------------------------------------------------------- document-level sets

export interface Palette {
  id: string;
  name: string;
  colors: Pick<
    Theme["colors"],
    "accent" | "text" | "heading" | "muted" | "border"
  >;
}

export const PALETTES: Palette[] = [
  {
    id: "navy",
    name: "Navy",
    colors: {
      accent: "#23405c",
      text: "#3e3e3e",
      heading: "#1f2937",
      muted: "#6b7280",
      border: "#e5e7eb",
    },
  },
  {
    id: "slate",
    name: "Slate",
    colors: {
      accent: "#475569",
      text: "#334155",
      heading: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
    },
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      accent: "#166534",
      text: "#374151",
      heading: "#14532d",
      muted: "#6b7280",
      border: "#e5e7eb",
    },
  },
  {
    id: "burgundy",
    name: "Burgundy",
    colors: {
      accent: "#9f1239",
      text: "#3f3f46",
      heading: "#881337",
      muted: "#71717a",
      border: "#e7e5e4",
    },
  },
  {
    id: "teal",
    name: "Teal",
    colors: {
      accent: "#0f766e",
      text: "#374151",
      heading: "#134e4a",
      muted: "#6b7280",
      border: "#e5e7eb",
    },
  },
  {
    id: "plum",
    name: "Plum",
    colors: {
      accent: "#6d28d9",
      text: "#3f3f46",
      heading: "#4c1d95",
      muted: "#71717a",
      border: "#e9e5ff",
    },
  },
  {
    id: "amber",
    name: "Amber",
    colors: {
      accent: "#b45309",
      text: "#44403c",
      heading: "#78350f",
      muted: "#78716c",
      border: "#e7e5e4",
    },
  },
  {
    id: "mono",
    name: "Mono",
    colors: {
      accent: "#111827",
      text: "#1f2937",
      heading: "#000000",
      muted: "#6b7280",
      border: "#d1d5db",
    },
  },
];

export interface FontPair {
  id: string;
  name: string;
  heading: string;
  body: string;
}

/** Pairings that read well at resume sizes, rather than a list of 40 fonts. */
export const FONT_PAIRS: FontPair[] = [
  {
    id: "khand",
    name: "Khand",
    heading: "Khand, sans-serif",
    body: "Khand, sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  {
    id: "merriweather-inter",
    name: "Merriweather + Inter",
    heading: "Merriweather, serif",
    body: "Inter, sans-serif",
  },
  {
    id: "montserrat-lato",
    name: "Montserrat + Lato",
    heading: "Montserrat, sans-serif",
    body: "Lato, sans-serif",
  },
  {
    id: "lato",
    name: "Lato",
    heading: "Lato, sans-serif",
    body: "Lato, sans-serif",
  },
  {
    id: "georgia",
    name: "Georgia",
    heading: "Georgia, serif",
    body: "Georgia, serif",
  },
  {
    id: "source",
    name: "Source Sans",
    heading: "'Source Sans Pro', sans-serif",
    body: "'Source Sans Pro', sans-serif",
  },
  {
    id: "poppins-opensans",
    name: "Poppins + Open Sans",
    heading: "Poppins, sans-serif",
    body: "'Open Sans', sans-serif",
  },
];

export const TEXT_SIZES = [
  { id: "s", name: "S", base: 11.7 },
  { id: "m", name: "M", base: 13.3 },
  { id: "l", name: "L", base: 15 },
  { id: "xl", name: "XL", base: 16.6 },
];

export const MARGIN_PRESETS = [
  { id: "none", name: "None", value: 0 },
  { id: "narrow", name: "Narrow", value: 24 },
  { id: "normal", name: "Normal", value: 40 },
  { id: "wide", name: "Wide", value: 60 },
];

export const SPACING_PRESETS = [
  { id: "tight", name: "Tight", lineHeight: 1.3 },
  { id: "normal", name: "Normal", lineHeight: 1.45 },
  { id: "airy", name: "Airy", lineHeight: 1.65 },
];

/** Apply a heading look, preserving the choices it does not own. */
export function applyHeadingLook(
  style: SectionStyle,
  look: Look<Partial<HeadingStyle>>,
  theme: Theme,
): Partial<HeadingStyle> {
  const patch = look.build(theme);
  // Only the pill look forces a text colour; the rest keep the current one.
  if (!("color" in patch)) patch.color = style.heading.color;
  return patch;
}

export function currentLook<T>(looks: Look<T>[], value: T): string | null {
  return looks.find((l) => l.matches(value))?.id ?? null;
}

export type { ItemLayout };

// -------------------------------------------------- per-type layout variants

/**
 * One meaningful choice per section type, expressed as a patch of existing
 * schema values. "Compact experience" is really four settings; asking for it
 * by name beats asking for the four.
 */
export interface SectionVariant {
  id: string;
  name: string;
  hint?: string;
  patch: {
    items?: Partial<ItemLayout>;
    fields?: Record<string, { visible?: boolean; step?: number }>;
  };
}

export const SECTION_VARIANTS: Record<string, SectionVariant[]> = {
  experience: [
    {
      id: "detailed",
      name: "Detailed",
      hint: "Bullets under every role",
      patch: {
        items: { direction: "column", columns: null },
        fields: {
          description: { visible: true },
          company: { visible: true },
          location: { visible: true },
        },
      },
    },
    {
      id: "compact",
      name: "Compact",
      hint: "Roles only, no bullets",
      patch: {
        items: { direction: "column", columns: null },
        fields: {
          description: { visible: false },
          location: { visible: true },
        },
      },
    },
    {
      id: "minimal",
      name: "Minimal",
      hint: "Role, company and dates",
      patch: {
        items: { direction: "column", columns: null },
        fields: {
          description: { visible: false },
          location: { visible: false },
        },
      },
    },
  ],
  education: [
    {
      id: "full",
      name: "Full",
      patch: {
        items: { columns: null },
        fields: { location: { visible: true }, school: { visible: true } },
      },
    },
    {
      id: "compact",
      name: "Compact",
      patch: {
        items: { columns: null },
        fields: { location: { visible: false } },
      },
    },
    {
      id: "two-up",
      name: "Two up",
      hint: "Side by side",
      patch: {
        items: { columns: 2 },
        fields: { location: { visible: false } },
      },
    },
  ],
  skills: [
    {
      id: "chips",
      name: "Chips",
      patch: { items: { direction: "row", wrap: true, columns: null, gap: 6 } },
    },
    {
      id: "list",
      name: "List",
      patch: { items: { direction: "column", columns: null, gap: 4 } },
    },
    { id: "grid", name: "Grid", patch: { items: { columns: 2, gap: 4 } } },
  ],
  languages: [
    {
      id: "bars",
      name: "With bars",
      patch: { items: { columns: null }, fields: { meter: { visible: true } } },
    },
    {
      id: "text",
      name: "Text only",
      patch: {
        items: { columns: null },
        fields: { meter: { visible: false } },
      },
    },
    {
      id: "two-up",
      name: "Two up",
      patch: { items: { columns: 2 }, fields: { meter: { visible: false } } },
    },
  ],
  socials: [
    {
      id: "icons",
      name: "Icons",
      patch: {
        items: { direction: "row", wrap: true, columns: null },
        fields: { icon: { visible: true }, username: { visible: true } },
      },
    },
    {
      id: "stacked",
      name: "Stacked",
      patch: {
        items: { direction: "column", columns: null },
        fields: { icon: { visible: true }, username: { visible: true } },
      },
    },
    {
      id: "plain",
      name: "Plain",
      patch: {
        items: { direction: "row", wrap: true, columns: null },
        fields: { icon: { visible: false }, username: { visible: false } },
      },
    },
  ],
  strengths: [
    {
      id: "icons",
      name: "With icons",
      patch: {
        items: { columns: null },
        fields: { icon: { visible: true }, description: { visible: true } },
      },
    },
    {
      id: "text",
      name: "Text only",
      patch: {
        items: { columns: null },
        fields: { icon: { visible: false }, description: { visible: true } },
      },
    },
    {
      id: "two-up",
      name: "Two up",
      patch: {
        items: { columns: 2 },
        fields: { icon: { visible: true }, description: { visible: false } },
      },
    },
  ],
  projects: [
    {
      id: "detailed",
      name: "Detailed",
      patch: {
        items: { columns: null },
        fields: { description: { visible: true }, link: { visible: true } },
      },
    },
    {
      id: "compact",
      name: "Compact",
      patch: {
        items: { columns: null },
        fields: { description: { visible: false }, link: { visible: true } },
      },
    },
    {
      id: "two-up",
      name: "Two up",
      patch: {
        items: { columns: 2 },
        fields: { description: { visible: false } },
      },
    },
  ],
  certifications: [
    {
      id: "full",
      name: "Full",
      patch: {
        items: { columns: null },
        fields: { issuer: { visible: true }, date: { visible: true } },
      },
    },
    {
      id: "compact",
      name: "Compact",
      patch: {
        items: { columns: null },
        fields: { description: { visible: false }, issuer: { visible: true } },
      },
    },
    {
      id: "two-up",
      name: "Two up",
      patch: {
        items: { columns: 2 },
        fields: { description: { visible: false } },
      },
    },
  ],
};

/** Which variant the current settings correspond to, if any. */
export function currentVariant(
  type: string,
  node: { items: ItemLayout; fields: Record<string, { visible: boolean }> },
): string | null {
  const variants = SECTION_VARIANTS[type];
  if (!variants) return null;
  for (const variant of variants) {
    const itemsMatch = Object.entries(variant.patch.items ?? {}).every(
      ([k, v]) => node.items[k as keyof ItemLayout] === v,
    );
    const fieldsMatch = Object.entries(variant.patch.fields ?? {}).every(
      ([key, spec]) =>
        spec.visible === undefined ||
        (node.fields?.[key]?.visible !== false) === spec.visible,
    );
    if (itemsMatch && fieldsMatch) return variant.id;
  }
  return null;
}
