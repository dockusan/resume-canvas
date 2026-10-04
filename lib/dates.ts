/**
 * Display formats for the month-year values the date picker stores
 * ("YYYY-MM"). Recruiters and parsers both read "Jan 2022 – Present" more
 * reliably than the raw ISO value the resume used to print.
 */

export type DateFormat =
  | "MMM YYYY"
  | "MMMM YYYY"
  | "MM/YYYY"
  | "YYYY-MM"
  | "YYYY";

export const DATE_FORMATS: { id: DateFormat; name: string }[] = [
  { id: "MMM YYYY", name: "Jan 2024" },
  { id: "MMMM YYYY", name: "January 2024" },
  { id: "MM/YYYY", name: "01/2024" },
  { id: "YYYY", name: "2024" },
];

export const DEFAULT_DATE_FORMAT: DateFormat = "MMM YYYY";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Format one stored value. Anything that isn't YYYY-MM passes through. */
export function formatMonth(
  value: string | undefined,
  format: DateFormat = DEFAULT_DATE_FORMAT,
): string {
  const v = (value ?? "").trim();
  const m = v.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return v;
  const year = m[1];
  const month = Number(m[2]);
  if (month < 1 || month > 12) return v;
  switch (format) {
    case "MMM YYYY":
      return `${MONTHS[month - 1].slice(0, 3)} ${year}`;
    case "MMMM YYYY":
      return `${MONTHS[month - 1]} ${year}`;
    case "MM/YYYY":
      return `${String(month).padStart(2, "0")}/${year}`;
    case "YYYY":
      return year;
    default:
      return v;
  }
}

/** "Jan 2022 – Present"; empty when neither end is set. */
export function formatRange(
  item: { startDate?: string; endDate?: string; current?: boolean },
  format: DateFormat = DEFAULT_DATE_FORMAT,
  placeholders?: { start: string; end: string },
): string {
  const start = formatMonth(item.startDate, format);
  const end = item.current ? "Present" : formatMonth(item.endDate, format);
  if (!start && !end) {
    return placeholders ? `${placeholders.start} – ${placeholders.end}` : "";
  }
  if (format === "YYYY" && start && start === end) return start;
  return `${start || placeholders?.start || ""} – ${end || placeholders?.end || ""}`
    .replace(/^ – | – $/g, "")
    .trim();
}
