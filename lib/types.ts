export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  twitter: string;
  summary: string;
  photoUrl?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string; // HTML or Markdown or plain text with newlines
  bulletStyle?: string;
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Project {
  id: string;
  name: string;
  link: string;
  date: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level?: number; // 1-5 or similar
}

export interface Language {
  id: string;
  name: string;
  proficiency: "Native" | "Fluent" | "Proficient" | "Intermediate" | "Basic";
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
  description?: string;
}

export interface Strength {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface Social {
  id: string;
  platform: string;
  url: string;
  username: string;
  icon?: string;
}

export interface CustomSectionItem {
  id: string;
  title?: string;
  subtitle?: string;
  date?: string;
  link?: string;
  description?: string; // plain text, newline-separated bullets
  bulletStyle?: string;
  icon?: string; // lucide icon name
}

export interface CustomSection {
  id: string; // referenced from column config as `custom:${id}`
  items: CustomSectionItem[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
  strengths: Strength[];
  socials: Social[];
  customSections: CustomSection[];
}

export type TemplateType =
  | "classic"
  | "sidebar"
  | "clean"
  | "minimal"
  | "executive"
  | "compact"
  // Retired; still accepted from older saves (see PRESET_ALIASES).
  | "modern"
  | "modern-2col"
  | "creative";

export interface SectionConfig {
  id: string;
  name: string;
  visible: boolean;
  /** Force this section to start at the top of a new PDF page. */
  pageBreakBefore?: boolean;
}

export type FontWeightOverride = 400 | 500 | 600 | 700;

/**
 * Style override applied at section, item, or field level.
 * Keyed in ResumeSettings.styleOverrides by path, cascading section → item → field:
 *   "experience" | "experience.heading" | "experience.<itemId>" |
 *   "experience.<itemId>.title" | "personalInfo.fullName" | "custom:<uuid>" | "header"
 */
export interface StyleOverride {
  fontSizeDelta?: number; // in px, added to the computed size
  color?: string;
  fontWeight?: FontWeightOverride;
}

export interface ResumeSettings {
  themeColor: string;
  fontFamily: string;
  fontSize: "sm" | "md" | "lg" | "xl";
  documentSize: "A4" | "Letter";
  template: TemplateType;
  leftColumn: SectionConfig[];
  rightColumn: SectionConfig[];
  styleOverrides: Record<string, StyleOverride>;
  showPhoto: boolean;
  photoStyle?: "square" | "rounded" | "circle";
  /** Contact fields hidden from the header. Missing entry = visible. */
  personalFieldVisibility?: Partial<Record<PersonalContactField, boolean>>;
  /** Missing = icons shown. */
  showContactIcons?: boolean;
  /** How month-year dates print. Missing = "MMM YYYY". */
  dateFormat?: import("./dates").DateFormat;
}

/** Header fields the personal controller can show/hide. */
export type PersonalContactField =
  | "title"
  | "email"
  | "phone"
  | "location"
  | "website"
  | "linkedin"
  | "github"
  | "twitter";
