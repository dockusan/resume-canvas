/**
 * The six former templates, re-expressed as data.
 *
 * These are starting points, not modes: once a document is seeded from a preset
 * every value below is editable. `themeColor` is threaded in at seed time so an
 * existing user's accent colour survives migration.
 *
 * Two fidelity notes carried over deliberately:
 *  - Creative used to render `rightColumn` in the visually-LEFT sidebar. Here
 *    `left` always means left; the migration swaps its columns to match.
 *  - The decorative bars that were hardcoded JSX (Classic's darkened strip,
 *    Executive's accent rule, Creative's gradient) are now `decorations`.
 */

import {
  ColumnId,
  DocumentPreset,
  HeaderSpec,
  Placement,
  SectionStyle,
  SectionType,
  Theme,
} from "./document";
import {
  DEFAULT_THEME,
  ON_FILL_TEXT,
  border,
  box,
  emptyBox,
  font,
  heading,
  noFill,
  noSeparator,
  sectionStyle,
  sides,
  solid,
} from "./defaults";
import { darkenColor } from "@/lib/utils";

const withAccent = (accent: string, patch: Partial<Theme> = {}): Theme => ({
  ...DEFAULT_THEME,
  ...patch,
  colors: { ...DEFAULT_THEME.colors, accent, ...(patch.colors ?? {}) },
});

const defaultHeader = (): HeaderSpec => ({
  placement: "band" as const,
  direction: "row" as const,
  align: "left" as const,
  background: noFill,
  padding: box(0, 0, 16, 0),
  border: null,
  photo: {
    visible: true,
    size: 80,
    shape: "circle" as const,
    border: null,
    shadow: null,
    rotate: 0,
    slot: "header",
    align: "center",
  },
  photoPosition: "end" as const,
  type: { name: 5, title: 2, contact: -1 },
  contacts: {
    placement: "below" as const,
    direction: "row" as const,
    align: "start" as const,
    gap: 12,
    showIcons: true,
    iconPosition: "before" as const,
    separator: noSeparator,
  },
});

const ALL_LEFT: Partial<Record<SectionType, Placement>> = {
  summary: "left",
  experience: "left",
  education: "left",
  projects: "left",
  strengths: "left",
  skills: "left",
  socials: "left",
  languages: "left",
  certifications: "left",
  custom: "left",
};

const SPLIT: Partial<Record<SectionType, Placement>> = {
  summary: "left",
  experience: "left",
  education: "left",
  projects: "left",
  custom: "left",
  strengths: "right",
  skills: "right",
  socials: "right",
  languages: "right",
  certifications: "right",
};

// --------------------------------------------------------------------------

/** Uppercase, tracked heading face shared by most templates. */
const capsHeading = (weight = 600, tracking = 1.2) =>
  font({ weight, letterSpacing: tracking, transform: "uppercase" });

function classic(accent: string): DocumentPreset {
  return {
    id: "classic",
    name: "Classic",
    description:
      "Main column beside a filled sidebar, with icons and skill tags.",
    page: { margin: box(0), background: solid("#ffffff") },
    theme: withAccent(accent),
    layout: {
      columns: 2,
      ratio: 0.65,
      gap: 0,
      fills: { left: noFill, right: solid(accent) },
      padding: { left: box(40, 30, 28, 38), right: box(46, 30, 28, 28) },
      header: {
        ...defaultHeader(),
        placement: "left",
        padding: box(0, 0, 6, 0),
        type: { name: 5.5, title: 2, contact: -0.5 },
        photo: {
          visible: true,
          size: 96,
          shape: "circle",
          border: border("#ffffff", 3, sides(true, true, true, true)),
          shadow: null,
          rotate: 0,
          slot: "right",
          align: "center",
        },
        contacts: { ...defaultHeader().contacts, gap: 14 },
      },
      decorations: [
        {
          target: "right",
          edge: "top",
          size: 6,
          fill: solid(darkenColor(accent, 0.6)),
        },
      ],
    },
    sectionStyle: {
      left: sectionStyle("classic", {
        heading: heading({
          step: 2,
          font: capsHeading(500, 1.6),
          border: border("#dfe3e8", 2),
          padding: box(0, 0, 3, 0),
          marginBottom: 8,
        }),
        container: emptyBox({ padding: box(0, 0, 14, 0) }),
      }),
      right: sectionStyle("classic", {
        heading: heading({
          step: 2,
          font: capsHeading(500, 1.6),
          color: ON_FILL_TEXT,
          border: border("rgba(255,255,255,0.55)", 1.5),
          padding: box(0, 0, 3, 0),
          marginBottom: 9,
        }),
        container: emptyBox({ padding: box(0, 0, 16, 0) }),
      }),
      full: sectionStyle("classic"),
    },
    defaultPlacement: SPLIT,
  };
}

function sidebar(accent: string): DocumentPreset {
  return {
    id: "sidebar",
    name: "Modern Sidebar",
    description: "Dark header band over a main column and a light sidebar.",
    page: { margin: box(0), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent,
        text: "#334155",
        heading: "#0f172a",
        muted: "#64748b",
        border: "#e2e8f0",
      },
    }),
    layout: {
      columns: 2,
      ratio: 0.66,
      gap: 0,
      fills: { left: noFill, right: solid("#f8fafc") },
      padding: { left: box(26, 26, 24, 44), right: box(26, 34, 24, 24) },
      header: {
        ...defaultHeader(),
        placement: "band",
        background: solid("#0f172a"),
        padding: box(34, 44, 26, 44),
        type: { name: 5, title: 1.75, contact: -1 },
        photo: { ...defaultHeader().photo, visible: false },
        contacts: { ...defaultHeader().contacts, gap: 16 },
      },
      decorations: [
        { target: "right", edge: "left", size: 1, fill: solid("#e2e8f0") },
      ],
    },
    sectionStyle: {
      left: sectionStyle("sidebar", {
        heading: heading({
          variant: "bar",
          step: 1.5,
          font: capsHeading(700, 1.5),
          color: "#0f172a",
          border: null,
          padding: box(0),
          marginBottom: 8,
        }),
        container: emptyBox({ padding: box(0, 0, 14, 0) }),
      }),
      right: sectionStyle("sidebar", {
        heading: heading({
          variant: "bar",
          step: 1.5,
          font: capsHeading(700, 1.5),
          color: "#0f172a",
          border: null,
          padding: box(0),
          marginBottom: 8,
        }),
        container: emptyBox({ padding: box(0, 0, 14, 0) }),
      }),
      full: sectionStyle("sidebar"),
    },
    defaultPlacement: SPLIT,
  };
}

function clean(accent: string): DocumentPreset {
  return {
    id: "clean",
    name: "Clean",
    description:
      "One column, no icons or photo: the safest choice for ATS portals.",
    page: { margin: box(44, 50), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent,
        text: "#1f2937",
        heading: "#111827",
        muted: "#6b7280",
      },
    }),
    layout: {
      columns: 1,
      ratio: 1,
      gap: 0,
      fills: { left: noFill, right: noFill },
      padding: { left: box(0), right: box(0) },
      header: {
        ...defaultHeader(),
        placement: "band",
        padding: box(0, 0, 14, 0),
        border: border(accent, 2),
        type: { name: 4.5, title: 1.75, contact: -1 },
        photo: { ...defaultHeader().photo, visible: false },
        contacts: {
          ...defaultHeader().contacts,
          gap: 10,
          showIcons: false,
          separator: {
            kind: "line",
            color: "#cbd5e1",
            thickness: 1,
            spacing: 10,
          },
        },
      },
      decorations: [],
    },
    sectionStyle: {
      left: sectionStyle("clean"),
      right: sectionStyle("clean"),
      full: sectionStyle("clean", {
        heading: heading({
          step: 1.5,
          // Untracked: letter-spacing makes PDF text extract as "S K I L L S".
          font: capsHeading(700, 0),
          color: accent,
          border: border("#e5e7eb", 1),
          padding: box(0, 0, 3, 0),
          marginBottom: 8,
        }),
        container: emptyBox({ padding: box(14, 0, 4, 0) }),
      }),
    },
    defaultPlacement: ALL_LEFT,
  };
}

function minimal(accent: string): DocumentPreset {
  return {
    id: "minimal",
    name: "Minimal",
    description: "Centred header, quiet rules and plenty of whitespace.",
    page: { margin: box(52, 56), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent: "#111827",
        text: "#262626",
        heading: "#111827",
        muted: "#737373",
      },
    }),
    layout: {
      columns: 1,
      ratio: 1,
      gap: 0,
      fills: { left: noFill, right: noFill },
      padding: { left: box(0), right: box(0) },
      header: {
        ...defaultHeader(),
        direction: "column",
        align: "center",
        padding: box(0, 0, 22, 0),
        type: { name: 4.5, title: 1.25, contact: -1 },
        photo: { ...defaultHeader().photo, visible: false },
        contacts: {
          ...defaultHeader().contacts,
          align: "center",
          gap: 10,
          showIcons: false,
          separator: {
            kind: "line",
            color: "#d4d4d4",
            thickness: 1,
            spacing: 10,
          },
        },
      },
      decorations: [],
    },
    sectionStyle: {
      left: sectionStyle("minimal"),
      right: sectionStyle("minimal"),
      full: sectionStyle("minimal", {
        heading: heading({
          step: 1.25,
          font: capsHeading(600, 2.4),
          color: "#111827",
          border: border("#e5e5e5", 1),
          padding: box(0, 0, 4, 0),
          marginBottom: 10,
        }),
        container: emptyBox({ padding: box(0, 0, 18, 0) }),
      }),
    },
    defaultPlacement: ALL_LEFT,
  };
}

function executive(accent: string): DocumentPreset {
  return {
    id: "executive",
    name: "Executive",
    description: "One column under an accent rule, with an optional photo.",
    page: { margin: box(40, 44), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent,
        text: "#374151",
        heading: "#111827",
      },
    }),
    layout: {
      columns: 1,
      ratio: 1,
      gap: 0,
      fills: { left: noFill, right: noFill },
      padding: { left: box(0), right: box(0) },
      header: {
        ...defaultHeader(),
        placement: "band",
        padding: box(0, 0, 18, 0),
        photoPosition: "start",
        type: { name: 5, title: 2, contact: -1 },
        photo: {
          visible: true,
          size: 88,
          shape: "circle",
          border: border("#e5e7eb", 1, sides(true, true, true, true)),
          shadow: null,
          rotate: 0,
          slot: "header",
          align: "center",
        },
        contacts: {
          ...defaultHeader().contacts,
          showIcons: false,
          gap: 10,
          separator: {
            kind: "line",
            color: "#d1d5db",
            thickness: 1,
            spacing: 10,
          },
        },
      },
      decorations: [
        { target: "page", edge: "top", size: 8, fill: solid(accent) },
      ],
    },
    sectionStyle: {
      left: sectionStyle("executive"),
      right: sectionStyle("executive"),
      full: sectionStyle("executive", {
        heading: heading({
          step: 2,
          font: capsHeading(700, 0.8),
          color: accent,
          border: border(accent, 2),
          padding: box(0, 0, 3, 0),
          marginBottom: 10,
        }),
        container: emptyBox({ padding: box(0, 0, 16, 0) }),
      }),
    },
    defaultPlacement: ALL_LEFT,
  };
}

function compact(accent: string): DocumentPreset {
  return {
    id: "compact",
    name: "Compact",
    description: "Tight margins and spacing to fit more on one page.",
    page: { margin: box(28, 34), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent,
        text: "#1f2937",
        heading: "#111827",
      },
    }),
    layout: {
      columns: 1,
      ratio: 1,
      gap: 0,
      fills: { left: noFill, right: noFill },
      padding: { left: box(0), right: box(0) },
      header: {
        ...defaultHeader(),
        placement: "band",
        padding: box(0, 0, 10, 0),
        border: border("#e5e7eb", 1),
        type: { name: 4, title: 1.5, contact: -1 },
        photo: { ...defaultHeader().photo, visible: false },
        contacts: { ...defaultHeader().contacts, gap: 12 },
      },
      decorations: [],
    },
    sectionStyle: {
      left: sectionStyle("compact"),
      right: sectionStyle("compact"),
      full: sectionStyle("compact", {
        heading: heading({
          variant: "plain",
          step: 1.25,
          font: capsHeading(700, 1.2),
          color: accent,
          border: border(accent, 3, { left: true }),
          padding: box(0, 0, 0, 7),
          marginBottom: 6,
        }),
        container: emptyBox({ padding: box(10, 0, 0, 0) }),
      }),
    },
    defaultPlacement: ALL_LEFT,
    itemLayout: {
      experience: { gap: 8 },
      education: { gap: 6 },
      projects: { gap: 8 },
      certifications: { gap: 6 },
      strengths: { gap: 6 },
      languages: { direction: "row", wrap: true, gap: 16 },
    },
  };
}

// --------------------------------------------------------------------------

export const PRESET_BUILDERS: Record<
  string,
  (accent: string) => DocumentPreset
> = {
  classic,
  sidebar,
  clean,
  minimal,
  executive,
  compact,
};

/**
 * Retired template ids. Documents keep their own layout data, so these only
 * decide which card is highlighted and what "re-apply template" rebuilds.
 */
export const PRESET_ALIASES: Record<string, string> = {
  modern: "clean",
  "modern-2col": "sidebar",
  creative: "sidebar",
};

export function resolvePresetId(id: string): string {
  return PRESET_BUILDERS[id] ? id : (PRESET_ALIASES[id] ?? "classic");
}

export const PRESET_IDS = Object.keys(PRESET_BUILDERS);

export function buildPreset(id: string, accent: string): DocumentPreset {
  return PRESET_BUILDERS[resolvePresetId(id)](accent);
}

export const PRESET_META = PRESET_IDS.map((id) => {
  const p = buildPreset(id, DEFAULT_THEME.colors.accent);
  return { id, name: p.name, description: p.description };
});

export type { ColumnId, SectionStyle };
