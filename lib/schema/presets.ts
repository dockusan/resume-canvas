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
  ON_FILL_LINE,
  ON_FILL_TEXT,
  border,
  box,
  emptyBox,
  font,
  gradient,
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

function classic(accent: string): DocumentPreset {
  return {
    id: "classic",
    name: "Classic",
    description: "Two columns with a filled sidebar on the right.",
    page: { margin: box(0), background: solid("#ffffff") },
    theme: withAccent(accent),
    layout: {
      columns: 2,
      ratio: 0.65,
      gap: 0,
      fills: { left: noFill, right: solid(accent) },
      padding: { left: box(24, 20, 24, 24), right: box(24) },
      header: {
        ...defaultHeader(),
        placement: "left",
        padding: box(0, 0, 12, 0),
        photo: {
          visible: true,
          size: 96,
          shape: "circle",
          border: border("#ffffff", 3, sides(true, true, true, true)),
          shadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          rotate: 0,
          slot: "right",
          align: "center",
        },
        contacts: {
          ...defaultHeader().contacts,
          gap: 12,
          separator: noSeparator,
        },
      },
      decorations: [
        {
          target: "right",
          edge: "top",
          size: 16,
          fill: solid(darkenColor(accent, 0.7)),
        },
      ],
    },
    sectionStyle: {
      left: sectionStyle("classic", {
        heading: heading({ step: 1, font: DEFAULT_THEME.fonts.heading }),
        marker: {
          kind: "dot",
          color: "#d1d5db",
          size: 8,
          offset: -5,
          rail: { enabled: true, color: "#e5e7eb", width: 2 },
        },
        itemBox: emptyBox({ padding: box(0, 0, 0, 12) }),
      }),
      right: sectionStyle("classic", {
        heading: heading({
          step: 1,
          color: ON_FILL_TEXT,
          border: border(ON_FILL_LINE),
          padding: box(0, 0, 4, 0),
        }),
      }),
      full: sectionStyle("classic"),
    },
    defaultPlacement: SPLIT,
  };
}

function minimal(accent: string): DocumentPreset {
  return {
    id: "minimal",
    name: "Minimal",
    description: "Single column, generous whitespace, no colour.",
    page: { margin: box(40), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent: "#333333",
        text: "#000000",
        heading: "#3e3e3e",
      },
      fonts: {
        heading: font({
          weight: 700,
          letterSpacing: 1.2,
          transform: "uppercase",
        }),
        body: font(),
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
        align: "left",
        padding: box(0, 0, 24, 0),
        border: border("#e5e7eb"),
        photo: {
          visible: true,
          size: 80,
          shape: "circle",
          border: null,
          shadow: null,
          rotate: 0,
          slot: "header",
          align: "center",
        },
        contacts: { ...defaultHeader().contacts, gap: 16, showIcons: false },
      },
      decorations: [],
    },
    sectionStyle: {
      left: sectionStyle("minimal", {
        heading: heading({ step: 0, padding: box(0, 0, 4, 0) }),
      }),
      right: sectionStyle("minimal"),
      full: sectionStyle("minimal", {
        heading: heading({ step: 0, padding: box(0, 0, 4, 0) }),
      }),
    },
    defaultPlacement: ALL_LEFT,
  };
}

function modern1col(accent: string): DocumentPreset {
  return {
    id: "modern",
    name: "Modern",
    description: "Single column under a full-width coloured banner.",
    page: { margin: box(0), background: solid("#ffffff") },
    theme: withAccent(accent),
    layout: {
      columns: 1,
      ratio: 1,
      gap: 0,
      fills: { left: noFill, right: noFill },
      padding: { left: box(32), right: box(32) },
      header: {
        ...defaultHeader(),
        placement: "band",
        background: solid(accent),
        padding: box(24, 32),
        photoPosition: "start",
        photo: {
          visible: true,
          size: 80,
          shape: "circle",
          border: border(
            "rgba(255,255,255,0.5)",
            2,
            sides(true, true, true, true),
          ),
          shadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          rotate: 0,
          slot: "header",
          align: "center",
        },
        contacts: { ...defaultHeader().contacts, gap: 16 },
      },
      decorations: [],
    },
    sectionStyle: {
      left: sectionStyle("modern", {
        heading: heading({
          variant: "underline",
          step: 1,
          color: accent,
          border: border(accent, 2),
          marginBottom: 16,
        }),
      }),
      right: sectionStyle("modern"),
      full: sectionStyle("modern", {
        heading: heading({
          variant: "underline",
          step: 1,
          color: accent,
          border: border(accent, 2),
          marginBottom: 16,
        }),
      }),
    },
    defaultPlacement: ALL_LEFT,
  };
}

function modern2col(accent: string): DocumentPreset {
  return {
    id: "modern-2col",
    name: "Modern Two Column",
    description: "Full-width header band above two columns.",
    page: { margin: box(0), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: { ...DEFAULT_THEME.colors, accent, text: "#4b5563" },
    }),
    layout: {
      columns: 2,
      ratio: 0.65,
      gap: 0,
      fills: { left: noFill, right: solid("rgba(249,250,251,0.5)") },
      padding: { left: box(32, 24, 32, 32), right: box(32, 32, 32, 24) },
      header: {
        ...defaultHeader(),
        placement: "band",
        background: solid("#f9fafb"),
        padding: box(32, 32, 24, 32),
        border: border("#e5e7eb", 2),
        photoPosition: "start",
        contacts: {
          ...defaultHeader().contacts,
          placement: "beside",
          direction: "column",
          align: "end",
          gap: 6,
          iconPosition: "after",
        },
      },
      decorations: [],
    },
    sectionStyle: {
      left: sectionStyle("modern-2col", {
        heading: heading({
          step: 1,
          font: font({
            weight: 700,
            letterSpacing: 0.6,
            transform: "uppercase",
          }),
          border: border("#e5e7eb", 2),
          marginBottom: 16,
        }),
        itemBox: emptyBox({ padding: box(0, 0, 0, 16) }),
        marker: {
          kind: "none",
          color: `${accent}40`,
          size: 0,
          offset: 0,
          rail: { enabled: true, color: `${accent}40`, width: 2 },
        },
      }),
      right: sectionStyle("modern-2col", {
        heading: heading({
          step: 1,
          font: font({
            weight: 700,
            letterSpacing: 0.6,
            transform: "uppercase",
          }),
          border: border("#e5e7eb", 2),
          marginBottom: 16,
        }),
      }),
      full: sectionStyle("modern-2col"),
    },
    defaultPlacement: SPLIT,
  };
}

function executive(accent: string): DocumentPreset {
  return {
    id: "executive",
    name: "Executive",
    description: "Single column with an accent rule across the top.",
    page: { margin: box(32), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: {
        ...DEFAULT_THEME.colors,
        accent,
        text: "#374151",
        heading: "#374151",
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
        padding: box(0, 0, 24, 0),
        photoPosition: "start",
        photo: {
          visible: true,
          size: 96,
          shape: "circle",
          border: border("#e5e7eb", 1, sides(true, true, true, true)),
          shadow: "0 1px 2px rgba(0,0,0,0.05)",
          rotate: 0,
          slot: "header",
          align: "center",
        },
        contacts: {
          ...defaultHeader().contacts,
          showIcons: false,
          gap: 12,
          separator: {
            kind: "line",
            color: "#d1d5db",
            thickness: 1,
            spacing: 12,
          },
        },
      },
      decorations: [
        { target: "page", edge: "top", size: 8, fill: solid(accent) },
      ],
    },
    sectionStyle: {
      left: sectionStyle("executive", {
        heading: heading({
          step: 0,
          font: font({
            weight: 700,
            letterSpacing: 0.6,
            transform: "uppercase",
          }),
          color: "#374151",
          padding: box(0, 0, 4, 0),
        }),
        itemBox: emptyBox({ padding: box(0, 0, 8, 0) }),
      }),
      right: sectionStyle("executive"),
      full: sectionStyle("executive", {
        heading: heading({
          step: 0,
          font: font({
            weight: 700,
            letterSpacing: 0.6,
            transform: "uppercase",
          }),
          color: "#374151",
          padding: box(0, 0, 4, 0),
        }),
        itemBox: emptyBox({ padding: box(0, 0, 8, 0) }),
      }),
    },
    defaultPlacement: ALL_LEFT,
  };
}

function creative(accent: string): DocumentPreset {
  return {
    id: "creative",
    name: "Creative",
    description: "Tinted sidebar on the left with pill headings.",
    page: { margin: box(0), background: solid("#ffffff") },
    theme: withAccent(accent, {
      colors: { ...DEFAULT_THEME.colors, accent, text: "#4b5563" },
    }),
    layout: {
      columns: 2,
      // Sidebar is the LEFT column here — the old template achieved this by
      // rendering `rightColumn` first, which the migration now normalises.
      ratio: 0.35,
      gap: 0,
      fills: { left: solid("#f3f4f6"), right: noFill },
      padding: { left: box(24), right: box(24, 24, 24, 32) },
      header: {
        ...defaultHeader(),
        placement: "left",
        direction: "column",
        align: "center",
        padding: box(0, 0, 16, 0),
        photoPosition: "start",
        photo: {
          visible: true,
          size: 96,
          shape: "circle",
          border: border("#ffffff", 4, sides(true, true, true, true)),
          shadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          rotate: -2,
          slot: "header",
          align: "center",
        },
        contacts: {
          ...defaultHeader().contacts,
          direction: "column",
          align: "start",
          gap: 8,
        },
      },
      decorations: [
        {
          target: "left",
          edge: "top",
          size: 8,
          fill: gradient("rgba(0,0,0,0)", "rgba(0,0,0,0.1)", 90),
        },
      ],
    },
    sectionStyle: {
      left: sectionStyle("creative", {
        heading: heading({
          variant: "pill",
          step: 0,
          color: "#3e3e3e",
          background: solid("#ffffff"),
          border: null,
          padding: box(4, 12),
          radius: 4,
          marginBottom: 12,
        }),
      }),
      right: sectionStyle("creative", {
        heading: heading({
          variant: "pill",
          step: 0,
          color: "#ffffff",
          background: solid(accent),
          border: null,
          padding: box(4, 12),
          radius: 4,
          marginBottom: 12,
        }),
        itemBox: emptyBox({ padding: box(0, 0, 0, 20) }),
        marker: {
          kind: "dot",
          color: accent,
          size: 10,
          offset: -6,
          rail: { enabled: true, color: `${accent}30`, width: 2 },
        },
      }),
      full: sectionStyle("creative"),
    },
    // Sidebar (left) carries the compact sections; main column the narrative.
    defaultPlacement: {
      summary: "right",
      experience: "right",
      education: "right",
      projects: "right",
      custom: "right",
      strengths: "left",
      skills: "left",
      socials: "left",
      languages: "left",
      certifications: "left",
    },
  };
}

// --------------------------------------------------------------------------

export const PRESET_BUILDERS: Record<
  string,
  (accent: string) => DocumentPreset
> = {
  classic,
  minimal,
  modern: modern1col,
  "modern-2col": modern2col,
  executive,
  creative,
};

export const PRESET_IDS = Object.keys(PRESET_BUILDERS);

export function buildPreset(id: string, accent: string): DocumentPreset {
  const make = PRESET_BUILDERS[id] ?? PRESET_BUILDERS.classic;
  return make(accent);
}

export const PRESET_META = PRESET_IDS.map((id) => {
  const p = buildPreset(id, DEFAULT_THEME.colors.accent);
  return { id, name: p.name, description: p.description };
});

export type { ColumnId, SectionStyle };
