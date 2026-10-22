/**
 * Maps validated AI output onto the editor's own item shapes. Runs in the
 * browser, which is what assigns ids.
 */

import { v4 as uuidv4 } from "uuid";
import { bulletLines } from "@/lib/ats/checks";
import { ICON_REGISTRY } from "@/lib/icons";
import { toPlainText } from "@/lib/richtext/runs";
import { SectionKey, isCustomSectionId } from "@/lib/store/useResumeStore";
import { CustomSectionItem, ResumeData } from "@/lib/types";
import {
  DraftItem,
  ImportedResume,
  PROFICIENCIES,
  QuickAddSection,
  RewriteKind,
  RewriteRequest,
} from "./types";

type Item = Record<string, unknown>;

/** Projects render their description as text, so bullets keep their glyph. */
const typedBullets = (bullets: string[]) =>
  bullets.length > 1
    ? bullets.map((b) => `• ${b}`).join("\n")
    : (bullets[0] ?? "");

const sentence = (bullets: string[]) => bullets.join(" ");

/** The registry's own spelling of a platform ("github" → "Github"), or a globe. */
function iconFor(platform: string): string {
  const key = platform.toLowerCase().replace(/[^a-z]/g, "");
  return (
    Object.keys(ICON_REGISTRY).find((k) => k.toLowerCase() === key) ?? "Globe"
  );
}

function customItem(d: DraftItem): Omit<CustomSectionItem, "id"> {
  return {
    title: d.title,
    subtitle: [d.subtitle, d.location].filter(Boolean).join(" • "),
    date:
      d.date ||
      [d.startDate, d.current ? "Present" : d.endDate]
        .filter(Boolean)
        .join(" – "),
    link: d.link,
    description: d.bullets.join("\n"),
    // One line reads as a sentence; several as a list.
    ...(d.bullets.length > 1 ? { bulletStyle: "default" } : {}),
  };
}

/**
 * One drafted entry as an item of `section`. Each section reads the generic
 * draft fields its own way — see the quick-add prompt for the contract.
 */
export function draftToItem(section: QuickAddSection, d: DraftItem): Item {
  switch (section) {
    case "experience":
      return {
        title: d.title,
        company: d.subtitle,
        location: d.location,
        startDate: d.startDate,
        endDate: d.endDate,
        current: d.current,
        description: d.bullets.join("\n"),
        bulletStyle: "default",
      };
    case "education":
      return {
        degree: d.title,
        school: d.subtitle,
        location: d.location,
        startDate: d.startDate,
        endDate: d.endDate,
        current: d.current,
      };
    case "projects":
      return {
        name: d.title,
        link: d.link,
        date: d.date || d.startDate,
        description: typedBullets(d.bullets),
      };
    case "skills":
      return { name: d.title };
    case "languages":
      return {
        name: d.title,
        proficiency:
          PROFICIENCIES.find(
            (p) => p.toLowerCase() === d.subtitle.toLowerCase(),
          ) ?? "Proficient",
      };
    case "certifications":
      return {
        name: d.title,
        issuer: d.subtitle,
        date: d.date || d.endDate || d.startDate,
        link: d.link,
        description: sentence(d.bullets),
      };
    case "strengths":
      return { title: d.title, description: sentence(d.bullets), icon: "Zap" };
    case "summary":
    case "custom":
      return customItem(d);
  }
}

/**
 * A whole imported resume as `ResumeData`, plus the heading of each custom
 * section it creates (keyed by the new section's uuid).
 */
export function importedToResumeData(r: ImportedResume): {
  data: ResumeData;
  titles: Record<string, string>;
} {
  const titles: Record<string, string> = {};
  const customSections = r.otherSections.map((section) => {
    const id = uuidv4();
    titles[id] = section.title;
    return {
      id,
      items: section.entries.map((e) => ({ ...customItem(e), id: uuidv4() })),
    };
  });

  const data: ResumeData = {
    personalInfo: { ...r.personalInfo, photoUrl: "" },
    experience: r.experience.map((e) => ({
      id: uuidv4(),
      title: e.title,
      company: e.company,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.bullets.join("\n"),
      bulletStyle: "default",
    })),
    education: r.education.map((e) => ({ id: uuidv4(), ...e })),
    projects: r.projects.map((p) => ({
      id: uuidv4(),
      name: p.name,
      link: p.link,
      date: p.date,
      description: typedBullets(p.bullets),
    })),
    skills: r.skills.map((name) => ({ id: uuidv4(), name })),
    languages: r.languages.map((l) => ({ id: uuidv4(), ...l })),
    certifications: r.certifications.map((c) => ({ id: uuidv4(), ...c })),
    strengths: r.strengths.map((s) => ({ id: uuidv4(), ...s, icon: "Zap" })),
    socials: r.profiles.map((p) => ({
      id: uuidv4(),
      platform: p.platform || "Website",
      url: p.url,
      username: p.username,
      icon: iconFor(p.platform),
    })),
    customSections,
  };
  return { data, titles };
}

/** What an import found, for the review step: "4 roles", "12 skills"… */
export function importSummary(r: ImportedResume): string[] {
  const count = (n: number, one: string, many = `${one}s`) =>
    n ? [`${n} ${n === 1 ? one : many}`] : [];
  return [
    ...count(r.experience.length, "role"),
    ...count(r.education.length, "qualification"),
    ...count(r.projects.length, "project"),
    ...count(r.skills.length, "skill"),
    ...count(r.languages.length, "language"),
    ...count(r.certifications.length, "certification"),
    ...count(r.strengths.length, "strength"),
    ...count(r.profiles.length, "profile link"),
    ...r.otherSections.map((s) => `${s.title} (${s.entries.length})`),
  ];
}

/** Which kind of entry an item is for a rewrite, or null if it has no points. */
export function rewriteKind(section: SectionKey): RewriteKind | null {
  if (section === "experience" || section === "projects") return section;
  return isCustomSectionId(section) ? "custom" : null;
}

const text = (value: unknown) =>
  typeof value === "string" ? toPlainText(value).trim() : "";

/** An item as the rewrite route reads it: plain text, points split out. */
export function rewriteRequestFor(
  kind: RewriteKind,
  item: Item,
  instruction: string,
): RewriteRequest {
  const range = [
    text(item.startDate),
    item.current ? "present" : text(item.endDate),
  ]
    .filter(Boolean)
    .join(" – ");
  const base = {
    kind,
    bullets: bulletLines(text(item.description)),
    instruction: instruction.trim(),
  };
  switch (kind) {
    case "experience":
      return {
        ...base,
        title: text(item.title),
        subtitle: [text(item.company), text(item.location)]
          .filter(Boolean)
          .join(" • "),
        dates: range,
      };
    case "projects":
      return {
        ...base,
        title: text(item.name),
        subtitle: text(item.link),
        dates: text(item.date),
      };
    case "custom":
      return {
        ...base,
        title: text(item.title),
        subtitle: text(item.subtitle),
        dates: text(item.date),
      };
  }
}

const TYPED_BULLET = /^\s*[•\-*◦▪]\s+/;

/**
 * The patch that swaps an item's points for `bullets`, written the way the
 * item already writes them: typed "•" markers stay typed, a chosen bullet
 * style is left alone. The rest of the item — title, dates — is untouched.
 */
export function rewritePatch(
  kind: RewriteKind,
  item: Item,
  bullets: string[],
): Item {
  if (kind === "projects") return { description: typedBullets(bullets) };
  const lines = text(item.description)
    .split("\n")
    .filter((l) => l.trim());
  if (
    !item.bulletStyle &&
    lines.length &&
    lines.every((l) => TYPED_BULLET.test(l))
  ) {
    return { description: bullets.map((b) => `• ${b}`).join("\n") };
  }
  return {
    description: bullets.join("\n"),
    ...(!item.bulletStyle && bullets.length > 1
      ? { bulletStyle: "default" }
      : {}),
  };
}
