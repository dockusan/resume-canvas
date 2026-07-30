import { PersonalContactField, ResumeSettings } from "./types";

export const PERSONAL_CONTACT_FIELDS: {
  field: PersonalContactField;
  label: string;
}[] = [
  { field: "title", label: "Job title" },
  { field: "phone", label: "Phone" },
  { field: "email", label: "Email" },
  { field: "location", label: "Location" },
  { field: "website", label: "Website" },
  { field: "linkedin", label: "LinkedIn" },
  { field: "github", label: "GitHub" },
  { field: "twitter", label: "Twitter" },
];

/** Header fields are visible unless explicitly turned off. */
export function isPersonalFieldVisible(
  settings: Pick<ResumeSettings, "personalFieldVisibility">,
  field: PersonalContactField,
): boolean {
  return settings.personalFieldVisibility?.[field] !== false;
}

export function showContactIcons(
  settings: Pick<ResumeSettings, "showContactIcons">,
): boolean {
  return settings.showContactIcons !== false;
}
