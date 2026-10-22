import { DEFAULT_THEME } from "./defaults";
import { PRESET_IDS, buildPreset } from "./presets";

/**
 * What each template is for, for people choosing one.
 *
 * Layout and photo come from the preset itself, so a filter can never
 * disagree with what the template renders. Who it suits is editorial, written
 * per template rather than generated: it describes intent, not structure.
 */

export const USE_CASES = [
  { id: "tech", label: "Tech & product" },
  { id: "leadership", label: "Senior & leadership" },
  { id: "traditional", label: "Academic & traditional" },
  { id: "creative", label: "Creative & design" },
  { id: "client", label: "Client-facing" },
  { id: "one-page", label: "Long history, one page" },
  { id: "portals", label: "Job portals (ATS)" },
] as const;

export type UseCase = (typeof USE_CASES)[number]["id"];

interface Note {
  best: string;
  detail: string;
  uses: UseCase[];
}

const NOTES: Record<string, Note> = {
  classic: {
    best: "Experienced professionals",
    detail:
      "A filled sidebar carries skills, links and languages while the main column holds your history. Icons and skill tags give it character without crowding the page.",
    uses: ["tech", "leadership"],
  },
  sidebar: {
    best: "Engineers and product roles",
    detail:
      "A dark header band over a main column and a light sidebar. Modern and confident, and the sidebar keeps long skill lists from pushing your experience onto page two.",
    uses: ["tech"],
  },
  clean: {
    best: "Online application portals",
    detail:
      "One column, standard headings, no icons and no photo. The version to upload when an applicant tracking system will read it before a person does.",
    uses: ["portals", "traditional"],
  },
  minimal: {
    best: "Academic and traditional fields",
    detail:
      "A centred header, quiet rules and generous whitespace. Nothing competes with the writing, and it survives conservative screening without comment.",
    uses: ["traditional", "portals"],
  },
  executive: {
    best: "Senior and leadership roles",
    detail:
      "A single wide column under an accent rule. Restrained, with room for long role descriptions and an optional portrait.",
    uses: ["leadership", "traditional"],
  },
  compact: {
    best: "Fitting everything on one page",
    detail:
      "Tight margins, side-rule headings and contacts beside your name. The densest layout here, for long histories that must stay on a single page.",
    uses: ["one-page", "tech"],
  },
  "accent-panel": {
    best: "Showing a face with your story",
    detail:
      "Your photo sits beside your name at the top of the main column, while a full-height accent panel holds strengths, languages and certifications.",
    uses: ["client", "creative"],
  },
  banner: {
    best: "Making a strong first impression",
    detail:
      "Name, photo and contacts on an accent banner across the top. Below it a slim sidebar takes the extras and a wide column takes your history.",
    uses: ["creative", "client"],
  },
  duotone: {
    best: "Creative and design-adjacent roles",
    detail:
      "An accent name card heads a softly tinted sidebar. Two tones of one colour give it personality while the main column stays plain and readable.",
    uses: ["creative"],
  },
  "soft-sidebar": {
    best: "Client-facing roles",
    detail:
      "A centred portrait and name in a tinted sidebar, with contacts listed underneath. Friendly and approachable without losing structure.",
    uses: ["client"],
  },
  centered: {
    best: "Balanced, traditional layouts",
    detail:
      "One column under a centred photo and name, with centred accent titles. Symmetrical and calm, and easy for a reader to scan top to bottom.",
    uses: ["traditional", "client"],
  },
  cards: {
    best: "Modern tech and startup roles",
    detail:
      "Every section sits in its own outlined card. Clear boundaries make a long resume easy to skim, and the single column keeps it parser-friendly.",
    uses: ["tech"],
  },
  spotlight: {
    best: "Roles where presence matters",
    detail:
      "A large portrait tops the sidebar, and your name sits on an accent card above the main column. The most visual layout here.",
    uses: ["creative", "client"],
  },
  framed: {
    best: "Structured, formal resumes",
    detail:
      "Your header inside an accent frame, and each section under a solid title bar. Crisp and orderly, with a clear rhythm down the page.",
    uses: ["traditional", "leadership"],
  },
};

export interface TemplateInfo extends Note {
  id: string;
  name: string;
  columns: 1 | 2;
  /** The template has a place for a portrait (always optional). */
  photo: boolean;
}

export const TEMPLATE_CATALOG: TemplateInfo[] = PRESET_IDS.map((id) => {
  const preset = buildPreset(id, DEFAULT_THEME.colors.accent);
  return {
    id,
    name: preset.name,
    columns: preset.layout.columns,
    photo: preset.layout.header.photo.visible !== false,
    ...(NOTES[id] ?? { best: "", detail: preset.description, uses: [] }),
  };
});

/** Where a template is opened from: the builder, restyled, content kept. */
export const builderHref = (id: string) =>
  `/builder?template=${encodeURIComponent(id)}`;
