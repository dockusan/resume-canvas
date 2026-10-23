import { normalizeUrl } from "./richtext/runs";
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

/**
 * Where a header contact should link, or nothing for one that isn't a place
 * to go (job title, location). Every export that prints contacts links them
 * the same way: a URL a reader cannot click is a URL they have to retype.
 */
export function contactHref(
  field: PersonalContactField,
  value: string,
): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  switch (field) {
    case "email":
      return `mailto:${v}`;
    case "phone": {
      const digits = v.replace(/[^\d+]/g, "");
      return digits.replace(/\D/g, "").length >= 5
        ? `tel:${digits}`
        : undefined;
    }
    case "website":
    case "linkedin":
    case "github":
    case "twitter":
      return normalizeUrl(v) || undefined;
    default:
      return undefined;
  }
}
