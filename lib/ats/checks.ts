/**
 * Resume health checks for applicant tracking systems.
 *
 * Pure functions over the resume content and its presentation, so the panel
 * can re-run them on every edit. Each check says what it found and, when it
 * isn't passing, what to change. Nothing here leaves the browser.
 */

import { toPlainText } from "@/lib/richtext/runs";
import { ResumeDocument, SectionNode, fontSizeAt } from "@/lib/schema/document";
import { ResumeData } from "@/lib/types";

export type CheckStatus = "pass" | "warn" | "fail";

export interface AtsCheck {
  id: string;
  group: "Contact" | "Content" | "Impact" | "Format";
  label: string;
  status: CheckStatus;
  detail: string;
  /** Relative importance in the score. */
  weight: number;
}

export interface AtsReport {
  score: number;
  checks: AtsCheck[];
}

const plain = (v: string | undefined) =>
  toPlainText(v ?? "")
    .replace(/\s+/g, " ")
    .trim();

const words = (v: string) => (v.match(/\S+/g) ?? []).length;

/** Bullet lines of a description, with any typed markers stripped. */
export function bulletLines(description: string | undefined): string[] {
  return toPlainText(description ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*[•\-*◦▪]\s*/, "").trim())
    .filter(Boolean);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
/** Domains reserved for documentation — mail sent there goes nowhere. */
const PLACEHOLDER_DOMAINS = /@(example\.(com|org|net)|test\.com|domain\.com)$/i;
const HAS_NUMBER =
  /\d|%|\$|€|£|\b(one|two|three|four|five|six|seven|eight|nine|ten|double|triple|half)\b/i;
const WEAK_OPENERS =
  /^(responsible for|worked on|helped( with)?|assisted( with)?|involved in|duties included|tasked with|in charge of)\b/i;
const FIRST_PERSON = /\b(I|me|my|myself)\b/;

/** Headings parsers recognise, per section type. */
const STANDARD_HEADINGS: Record<string, RegExp> = {
  summary:
    /^(summary|professional summary|profile|about( me)?|objective|career summary)$/i,
  experience:
    /^(work experience|experience|professional experience|employment( history)?|work history|career history)$/i,
  education:
    /^(education|academic background|qualifications|education & training)$/i,
  projects:
    /^(projects|personal projects|selected projects|key projects|open source)$/i,
  skills:
    /^(skills|technical skills|core skills|key skills|skills & tools|core competencies|technologies)$/i,
  languages: /^(languages|language skills)$/i,
  certifications:
    /^(certifications?|licen[cs]es( & certifications)?|certificates?|courses)$/i,
  strengths:
    /^(strengths|key achievements|achievements|highlights|accomplishments)$/i,
  socials: /^(links|profiles|online profiles|social|portfolio)$/i,
};

function monthIndex(v: string | undefined): number | null {
  const m = (v ?? "").match(/^(\d{4})-(\d{1,2})$/);
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null;
}

export function runAtsChecks(
  data: ResumeData,
  doc: ResumeDocument,
  { pageCount, showPhoto }: { pageCount: number; showPhoto: boolean },
): AtsReport {
  const checks: AtsCheck[] = [];
  const add = (c: AtsCheck) => checks.push(c);
  const info = data.personalInfo;
  const visible = (type: string) =>
    doc.sections.some((s) => s.type === type && s.visible);

  // ---------------------------------------------------------------- contact
  const email = plain(info.email);
  add({
    id: "email",
    group: "Contact",
    label: "Working email address",
    weight: 3,
    ...(!email
      ? { status: "fail", detail: "Add an email so recruiters can reply." }
      : !EMAIL.test(email)
        ? {
            status: "fail",
            detail: `"${email}" doesn't look like a valid email.`,
          }
        : PLACEHOLDER_DOMAINS.test(email)
          ? {
              status: "fail",
              detail: `${email.split("@")[1]} is a placeholder domain that can't receive mail. Use your real address.`,
            }
          : { status: "pass", detail: email }),
  });
  add({
    id: "phone",
    group: "Contact",
    label: "Phone number",
    weight: 1,
    ...(plain(info.phone)
      ? { status: "pass", detail: plain(info.phone) }
      : { status: "warn", detail: "Most recruiters expect a phone number." }),
  });
  add({
    id: "location",
    group: "Contact",
    label: "Location",
    weight: 1,
    ...(plain(info.location)
      ? { status: "pass", detail: plain(info.location) }
      : {
          status: "warn",
          detail: "Add a city and country; many searches filter by location.",
        }),
  });
  const linkedin =
    plain(info.linkedin) ||
    data.socials.find((s) => /linkedin/i.test(s.platform + s.url))?.url;
  add({
    id: "linkedin",
    group: "Contact",
    label: "LinkedIn profile",
    weight: 1,
    ...(linkedin
      ? { status: "pass", detail: plain(linkedin) }
      : { status: "warn", detail: "Recruiters usually check LinkedIn next." }),
  });

  // ---------------------------------------------------------------- content
  const summaryWords = words(plain(info.summary));
  add({
    id: "summary",
    group: "Content",
    label: "Professional summary",
    weight: 2,
    ...(!visible("summary") || summaryWords === 0
      ? {
          status: "warn",
          detail: "A 2–4 sentence summary gives parsers and people context.",
        }
      : summaryWords < 25
        ? {
            status: "warn",
            detail: `Only ${summaryWords} words; aim for 40–90.`,
          }
        : summaryWords > 120
          ? {
              status: "warn",
              detail: `${summaryWords} words; trim it to under 100.`,
            }
          : { status: "pass", detail: `${summaryWords} words.` }),
  });

  const jobs = visible("experience") ? data.experience : [];
  add({
    id: "experience",
    group: "Content",
    label: "Work experience",
    weight: 3,
    ...(jobs.length
      ? { status: "pass", detail: `${jobs.length} roles listed.` }
      : { status: "fail", detail: "Add at least one role." }),
  });

  const undated = jobs.filter(
    (j) => !j.startDate || (!j.endDate && !j.current),
  );
  const backwards = jobs.filter((j) => {
    const s = monthIndex(j.startDate);
    const e = monthIndex(j.endDate);
    return !j.current && s !== null && e !== null && e < s;
  });
  if (jobs.length)
    add({
      id: "dates",
      group: "Content",
      label: "Every role has dates",
      weight: 2,
      ...(undated.length
        ? {
            status: "fail",
            detail: `Missing dates: ${undated.map((j) => plain(j.title) || "untitled").join(", ")}.`,
          }
        : backwards.length
          ? {
              status: "fail",
              detail: `End date is before the start: ${backwards.map((j) => plain(j.title)).join(", ")}.`,
            }
          : { status: "pass", detail: "Start and end (or Present) on each." }),
    });

  // Ordered by start date: an ongoing part-time role that began earlier
  // legitimately sits below a newer full-time one.
  const starts = jobs
    .map((j) => monthIndex(j.startDate))
    .filter((v): v is number => v !== null);
  const ordered = starts.every((v, i) => i === 0 || v <= starts[i - 1]);
  if (jobs.length > 1)
    add({
      id: "order",
      group: "Content",
      label: "Most recent role first",
      weight: 1,
      ...(ordered
        ? { status: "pass", detail: "Reverse-chronological order." }
        : {
            status: "warn",
            detail: "Reorder roles so the latest comes first.",
          }),
    });

  const skillCount = visible("skills") ? data.skills.length : 0;
  add({
    id: "skills",
    group: "Content",
    label: "Skills section",
    weight: 2,
    ...(skillCount >= 6
      ? { status: "pass", detail: `${skillCount} skills listed.` }
      : skillCount > 0
        ? {
            status: "warn",
            detail: `Only ${skillCount}; list 8–15 relevant skills.`,
          }
        : {
            status: "fail",
            detail: "Add a Skills section with your core tools.",
          }),
  });

  add({
    id: "education",
    group: "Content",
    label: "Education",
    weight: 1,
    ...(visible("education") && data.education.length
      ? { status: "pass", detail: `${data.education.length} entries.` }
      : {
          status: "warn",
          detail: "Most job filters look for an education entry.",
        }),
  });

  // ----------------------------------------------------------------- impact
  const bullets = jobs.flatMap((j) => bulletLines(j.description));
  const thin = jobs.filter((j) => bulletLines(j.description).length < 2);
  if (jobs.length)
    add({
      id: "bullets",
      group: "Impact",
      label: "2+ bullet points per role",
      weight: 2,
      ...(thin.length
        ? {
            status: "warn",
            detail: `Add detail to: ${thin.map((j) => plain(j.title) || "untitled").join(", ")}.`,
          }
        : {
            status: "pass",
            detail: `${bullets.length} bullets across ${jobs.length} roles.`,
          }),
    });

  if (bullets.length) {
    const quantified = bullets.filter((b) => HAS_NUMBER.test(b)).length;
    const share = Math.round((quantified / bullets.length) * 100);
    add({
      id: "metrics",
      group: "Impact",
      label: "Results backed by numbers",
      weight: 3,
      status: share >= 40 ? "pass" : share >= 20 ? "warn" : "fail",
      detail: `${quantified} of ${bullets.length} bullets (${share}%) include a number${
        share >= 40
          ? "."
          : "; aim for at least 40% — %, time saved, users, revenue."
      }`,
    });

    const long = bullets.filter((b) => words(b) > 32).length;
    add({
      id: "length",
      group: "Impact",
      label: "Bullets are concise",
      weight: 1,
      ...(long
        ? {
            status: "warn",
            detail: `${long} bullets run past ~2 lines; split or tighten them.`,
          }
        : { status: "pass", detail: "All bullets fit in about two lines." }),
    });

    const weak = bullets.filter((b) => WEAK_OPENERS.test(b));
    add({
      id: "verbs",
      group: "Impact",
      label: "Bullets start with action verbs",
      weight: 1,
      ...(weak.length
        ? {
            status: "warn",
            detail: `${weak.length} start with phrases like "Responsible for"; lead with what you did (Built, Cut, Led).`,
          }
        : { status: "pass", detail: "No passive openers found." }),
    });

    const firstPerson = bullets.filter((b) => FIRST_PERSON.test(b)).length;
    if (firstPerson)
      add({
        id: "pronouns",
        group: "Impact",
        label: "No first-person pronouns",
        weight: 1,
        status: "warn",
        detail: `${firstPerson} bullets use "I" or "my"; resumes conventionally drop them.`,
      });
  }

  // ----------------------------------------------------------------- format
  const odd = doc.sections.filter(
    (s: SectionNode) =>
      s.visible &&
      s.type !== "custom" &&
      STANDARD_HEADINGS[s.type] &&
      !STANDARD_HEADINGS[s.type].test(plain(s.title)),
  );
  add({
    id: "headings",
    group: "Format",
    label: "Standard section headings",
    weight: 2,
    ...(odd.length
      ? {
          status: "warn",
          detail: `Parsers may not recognise: ${odd.map((s) => `"${plain(s.title)}"`).join(", ")}. Prefer names like Experience, Skills, Links.`,
        }
      : { status: "pass", detail: "Every heading is one parsers expect." }),
  });

  const tracked = doc.sections.filter(
    (s) => s.visible && s.style.heading.font.letterSpacing > 0.6,
  );
  add({
    id: "tracking",
    group: "Format",
    label: "Headings extract as words",
    weight: 1,
    ...(tracked.length
      ? {
          status: "warn",
          detail:
            "Wide letter-spacing on headings can come out as “S K I L L S” in the PDF's text. The ATS-safe PDF removes it; or set tracking to 0 under Section → Advanced.",
        }
      : { status: "pass", detail: "No wide letter-spacing on headings." }),
  });

  add({
    id: "columns",
    group: "Format",
    label: "Single-column reading order",
    weight: 1,
    ...(doc.layout.columns === 2
      ? {
          status: "warn",
          detail:
            "Two columns read well to people but some older ATS mix them up. Use “ATS-safe PDF” when uploading to job portals.",
        }
      : { status: "pass", detail: "One column reads top to bottom." }),
  });

  add({
    id: "photo",
    group: "Format",
    label: "No photo",
    weight: 1,
    ...(showPhoto && plain(data.personalInfo.photoUrl)
      ? {
          status: "warn",
          detail:
            "Photos are ignored by parsers and discouraged in the US, UK and Canada.",
        }
      : { status: "pass", detail: "Nothing a parser can't read." }),
  });

  add({
    id: "pages",
    group: "Format",
    label: "Length",
    weight: 2,
    ...(pageCount <= 2
      ? {
          status: "pass",
          detail: `${pageCount} page${pageCount > 1 ? "s" : ""}.`,
        }
      : {
          status: "warn",
          detail: `${pageCount} pages; keep it to one or two.`,
        }),
  });

  const body = fontSizeAt(doc.theme, 0);
  add({
    id: "fontsize",
    group: "Format",
    label: "Readable text size",
    weight: 1,
    ...(body >= 12.5
      ? { status: "pass", detail: `${(body * 0.75).toFixed(1)}pt body text.` }
      : {
          status: "warn",
          detail: `${(body * 0.75).toFixed(1)}pt is small; 10–12pt is the norm.`,
        }),
  });

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.reduce(
    (n, c) =>
      n +
      (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0),
    0,
  );
  return { score: Math.round((earned / total) * 100), checks };
}
