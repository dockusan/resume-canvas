import type { Page } from "@playwright/test";
import { STORAGE_KEY, openBuilder, saved, waitForPages } from "./builder";

/**
 * Resumes built to stress the exports. Every bullet carries a unique tag
 * ("R3B4" = role 3, bullet 4) so a test can tell which line went missing,
 * moved or appears twice.
 */

type Item = Record<string, unknown>;

export interface ResumeFixture {
  personalInfo?: Record<string, string>;
  experience?: Item[];
  education?: Item[];
  projects?: Item[];
  certifications?: Item[];
  socials?: Item[];
  skills?: Item[];
}

const VERBS = [
  "Led",
  "Built",
  "Cut",
  "Shipped",
  "Designed",
  "Grew",
  "Automated",
  "Mentored",
  "Migrated",
  "Reduced",
];

export const bulletText = (role: number, bullet: number) =>
  `R${role}B${bullet} ${VERBS[(role + bullet) % VERBS.length]} a measurable improvement across the platform, lifting throughput by ${role * 10 + bullet}% for the team`;

const role = (n: number, bullets: number): Item => ({
  id: `role-${n}`,
  title: `Role ${n} Engineer`,
  company: `Company ${n}`,
  location: "Remote",
  startDate: `${2024 - n}-01`,
  endDate: `${2025 - n}-01`,
  current: false,
  description: Array.from({ length: bullets }, (_, b) =>
    bulletText(n, b + 1),
  ).join("\n"),
});

/** Seven roles of six bullets, plus education and projects: 3+ pages. */
export function longResume(): ResumeFixture {
  return {
    experience: Array.from({ length: 7 }, (_, i) => role(i + 1, 6)),
    education: Array.from({ length: 3 }, (_, i) => ({
      id: `edu-${i + 1}`,
      degree: `Degree ${i + 1} in Computer Science`,
      school: `University ${i + 1}`,
      location: "",
      startDate: `${2010 + i}-09`,
      endDate: `${2013 + i}-06`,
      current: false,
    })),
    projects: Array.from({ length: 5 }, (_, i) => ({
      id: `proj-${i + 1}`,
      name: `Project ${i + 1}`,
      link: `https://example.com/project-${i + 1}`,
      date: `${2020 + i}`,
      description: `P${i + 1} A tool that saved hours every week for the people who used it`,
    })),
  };
}

/** One role taller than a page on its own. */
export function oversizedRole(): ResumeFixture {
  return { experience: [role(1, 45)], projects: [], education: [] };
}

/**
 * Every kind of link the app can print: header contacts, project and
 * certification URLs, the Links section, and a link inside a bullet.
 */
export const LINKS = {
  website: "https://ada.example.dev",
  linkedin: "https://linkedin.com/in/ada-example",
  github: "https://github.com/ada-example",
  twitter: "https://twitter.com/ada_example",
  email: "mailto:ada@example.com",
  phone: "tel:+15551234567",
  project: "https://example.com/analytical-engine",
  certification: "https://example.com/cert/12345",
  social: "https://dribbble.com/ada-example",
  inline: "https://example.com/case-study",
} as const;

export function linkResume(): ResumeFixture {
  return {
    personalInfo: {
      fullName: "Ada Example",
      title: "Engineer",
      email: "ada@example.com",
      phone: "+1 (555) 123-4567",
      location: "London",
      website: "ada.example.dev",
      linkedin: "linkedin.com/in/ada-example",
      github: "https://github.com/ada-example",
      twitter: "https://twitter.com/ada_example",
      summary: "Engineer who writes things down.",
    },
    experience: [
      {
        ...role(1, 2),
        description: `Published a <a href="${LINKS.inline}">case study</a> read by the whole industry\nKept the lights on`,
      },
    ],
    projects: [
      {
        id: "p1",
        name: "Analytical Engine",
        link: LINKS.project,
        date: "1843",
        description: "Notes on the engine",
      },
    ],
    certifications: [
      {
        id: "c1",
        name: "Certified Example",
        issuer: "Example Board",
        date: "2020",
        link: LINKS.certification,
      },
    ],
    socials: [
      {
        id: "s1",
        platform: "Dribbble",
        url: LINKS.social,
        username: "ada-example",
        icon: "Globe",
      },
    ],
  };
}

/**
 * Open the builder with `fixture` in place of the sample's content. Sections
 * the fixture doesn't mention keep the sample's.
 */
export async function loadResume(page: Page, fixture: ResumeFixture) {
  await openBuilder(page);
  const { state, version } = await saved(page);
  const { personalInfo, ...sections } = fixture;
  const next = {
    version,
    state: {
      ...state,
      resumeData: {
        ...state.resumeData,
        ...sections,
        personalInfo: { ...state.resumeData.personalInfo, ...personalInfo },
      },
    },
  };
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    STORAGE_KEY,
    JSON.stringify(next),
  ] as const);
  await page.reload();
  await waitForPages(page);
}

export async function choosePaper(page: Page, size: "A4" | "Letter") {
  await page.getByRole("button", { name: "Document" }).click();
  await page.getByRole("button", { name: size, exact: true }).click();
}

/** The page count the builder shows in its toolbar. */
export async function shownPageCount(page: Page): Promise<number> {
  const label = await page
    .getByTitle("Length of the finished resume")
    .textContent();
  return Number(label?.match(/\d+/)?.[0]);
}
