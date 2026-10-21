/**
 * What the AI routes return, after the server has validated it.
 *
 * Deliberately id-less and plain-text: the browser assigns ids and maps these
 * onto `ResumeData` (see `apply.ts`), so a reply can never collide with or
 * overwrite an existing item by guessing its id.
 */

import { Language, PersonalInfo } from "@/lib/types";

export type Proficiency = Language["proficiency"];

export const PROFICIENCIES: readonly Proficiency[] = [
  "Native",
  "Fluent",
  "Proficient",
  "Intermediate",
  "Basic",
];

/** A titled entry: the shape of an "other" section and of every draft. */
export interface DraftItem {
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  /** A single date, for things that happen once (a project, an award). */
  date: string;
  link: string;
  bullets: string[];
}

export interface ImportedResume {
  personalInfo: Omit<PersonalInfo, "photoUrl">;
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }[];
  projects: { name: string; link: string; date: string; bullets: string[] }[];
  skills: string[];
  languages: { name: string; proficiency: Proficiency }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    link: string;
  }[];
  strengths: { title: string; description: string }[];
  /** Profiles beyond the header's LinkedIn / GitHub / X / website. */
  profiles: { platform: string; url: string; username: string }[];
  /** Awards, volunteering, publications… under their original heading. */
  otherSections: { title: string; entries: DraftItem[] }[];
}

/** Sections quick add can write into. "custom" is a new or existing custom section. */
export const QUICK_ADD_SECTIONS = [
  "experience",
  "education",
  "projects",
  "skills",
  "languages",
  "certifications",
  "strengths",
  "summary",
  "custom",
] as const;

export type QuickAddSection = (typeof QUICK_ADD_SECTIONS)[number];

export interface QuickAddDraft {
  section: QuickAddSection;
  /** Heading for a new custom section; empty otherwise. */
  sectionTitle: string;
  /** Only for the summary section. */
  summary: string;
  items: DraftItem[];
  /** Short prompts for what would make the entry stronger. */
  suggestions: string[];
}
