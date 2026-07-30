/**
 * Form descriptors for the content editor.
 *
 * Inline editing on the page is excellent for tweaking wording in context, but
 * it is a poor way to *enter* a resume — especially on a phone, where the page
 * renders at roughly 5px text. These descriptors drive a plain form over the
 * same store actions, so both surfaces edit one source of truth.
 */

import { SectionType } from "./document";

export type FormFieldType =
  | "text"
  | "textarea"
  | "bullets"
  | "dateRange"
  | "date"
  | "url"
  | "select"
  | "icon";

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: readonly string[];
  /** Half-width on wider screens, so related fields pair up. */
  half?: boolean;
}

export interface SectionForm {
  /** Singular noun for buttons: "Add experience". */
  itemNoun: string;
  /** Field used as the collapsed row's label. */
  titleKey: string;
  subtitleKey?: string;
  fields: FormField[];
}

const PROFICIENCY = [
  "Native",
  "Fluent",
  "Proficient",
  "Intermediate",
  "Basic",
] as const;

export const SECTION_FORMS: Record<SectionType, SectionForm> = {
  summary: {
    itemNoun: "summary",
    titleKey: "summary",
    fields: [
      {
        key: "summary",
        label: "Professional summary",
        type: "textarea",
        placeholder:
          "Two or three sentences on what you do and your strengths.",
      },
    ],
  },
  experience: {
    itemNoun: "role",
    titleKey: "title",
    subtitleKey: "company",
    fields: [
      {
        key: "title",
        label: "Job title",
        type: "text",
        placeholder: "Senior Engineer",
      },
      {
        key: "company",
        label: "Company",
        type: "text",
        placeholder: "Acme Inc.",
        half: true,
      },
      {
        key: "location",
        label: "Location",
        type: "text",
        placeholder: "Berlin",
        half: true,
      },
      { key: "__dates", label: "Dates", type: "dateRange" },
      {
        key: "description",
        label: "What you did",
        type: "bullets",
        placeholder: "One achievement per line",
      },
    ],
  },
  education: {
    itemNoun: "qualification",
    titleKey: "degree",
    subtitleKey: "school",
    fields: [
      {
        key: "degree",
        label: "Degree",
        type: "text",
        placeholder: "BSc Computer Science",
      },
      { key: "school", label: "School", type: "text", half: true },
      { key: "location", label: "Location", type: "text", half: true },
      { key: "__dates", label: "Dates", type: "dateRange" },
    ],
  },
  projects: {
    itemNoun: "project",
    titleKey: "name",
    subtitleKey: "link",
    fields: [
      { key: "name", label: "Name", type: "text" },
      {
        key: "link",
        label: "Link",
        type: "url",
        placeholder: "github.com/you/project",
        half: true,
      },
      {
        key: "date",
        label: "Date",
        type: "text",
        placeholder: "2024",
        half: true,
      },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  skills: {
    itemNoun: "skill",
    titleKey: "name",
    fields: [{ key: "name", label: "Skill", type: "text" }],
  },
  languages: {
    itemNoun: "language",
    titleKey: "name",
    subtitleKey: "proficiency",
    fields: [
      { key: "name", label: "Language", type: "text", half: true },
      {
        key: "proficiency",
        label: "Level",
        type: "select",
        options: PROFICIENCY,
        half: true,
      },
    ],
  },
  certifications: {
    itemNoun: "certification",
    titleKey: "name",
    subtitleKey: "issuer",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "issuer", label: "Issued by", type: "text", half: true },
      { key: "date", label: "Date", type: "text", half: true },
      { key: "link", label: "Link", type: "url" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  strengths: {
    itemNoun: "strength",
    titleKey: "title",
    fields: [
      { key: "icon", label: "Icon", type: "icon" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  socials: {
    itemNoun: "profile",
    titleKey: "platform",
    subtitleKey: "username",
    fields: [
      { key: "icon", label: "Icon", type: "icon" },
      { key: "platform", label: "Platform", type: "text", half: true },
      { key: "username", label: "Username", type: "text", half: true },
      { key: "url", label: "Link", type: "url" },
    ],
  },
  custom: {
    itemNoun: "entry",
    titleKey: "title",
    subtitleKey: "subtitle",
    fields: [
      { key: "icon", label: "Icon", type: "icon" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text", half: true },
      { key: "date", label: "Date", type: "text", half: true },
      { key: "link", label: "Link", type: "url" },
      { key: "description", label: "Description", type: "bullets" },
    ],
  },
};

export interface PersonalFormField extends FormField {
  key:
    | "fullName"
    | "title"
    | "email"
    | "phone"
    | "location"
    | "website"
    | "linkedin"
    | "github"
    | "twitter";
}

export const PERSONAL_FORM: PersonalFormField[] = [
  { key: "fullName", label: "Full name", type: "text" },
  {
    key: "title",
    label: "Headline",
    type: "text",
    placeholder: "Senior Engineer",
  },
  { key: "email", label: "Email", type: "text", half: true },
  { key: "phone", label: "Phone", type: "text", half: true },
  { key: "location", label: "Location", type: "text", half: true },
  { key: "website", label: "Website", type: "url", half: true },
  { key: "linkedin", label: "LinkedIn", type: "url", half: true },
  { key: "github", label: "GitHub", type: "url", half: true },
  { key: "twitter", label: "X / Twitter", type: "url", half: true },
];
