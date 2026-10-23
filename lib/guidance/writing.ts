/**
 * Writing guidance: what to put in each part of a resume, and a line-by-line
 * read of the bullets someone has written.
 *
 * Everything here is static text and pure functions — no AI, nothing sent
 * anywhere. The bullet rules are the ATS check's own, so a tip and the score
 * never disagree about the same line.
 */

import {
  FIRST_PERSON,
  HAS_NUMBER,
  WEAK_OPENERS,
  bulletLines,
  words,
} from "@/lib/ats/checks";

/** The shape of an achievement bullet. */
export const FORMULA = {
  parts: ["Action verb", "what you did", "the result — with a number"],
  example:
    "Cut checkout time from 9s to 2s by caching prices, lifting conversion 4%",
};

export type GuideKind = "summary" | "experience" | "projects" | "custom";

/** Questions that turn a duty into an achievement, per part of the resume. */
export const PROMPTS: Record<GuideKind, { lead: string; prompts: string[] }> = {
  summary: {
    lead: "Two or three sentences a recruiter can read in ten seconds.",
    prompts: [
      'Who are you professionally, and at what level? ("Backend engineer, 6 years")',
      "What are you known for — the one or two things you're best at?",
      "What's your strongest proof? A result, a scale, a name people recognise.",
      "What do you want next? Point it at the job you're applying for.",
    ],
  },
  experience: {
    lead: "Lead with what changed because you were there, not with your duties.",
    prompts: [
      "What did you build, fix, launch or lead?",
      "What was different afterwards — faster, cheaper, bigger, safer?",
      "How much? Time saved, money, users, error rate, team size.",
      "Who benefited — customers, a team, the business?",
    ],
  },
  projects: {
    lead: "Say what it does and why it mattered, then what you built it with.",
    prompts: [
      "What problem does it solve, and for whom?",
      "What was your part, if others were involved?",
      "Did anyone use it? Users, stars, downloads, a grade, a prize.",
      "What would a reader want to click — a demo, the code, a write-up?",
    ],
  },
  custom: {
    lead: "Each entry earns its place when it shows a result or a skill.",
    prompts: [
      "What did you do, and what came of it?",
      "Is there a number, a date or a name that makes it concrete?",
    ],
  },
};

export const ROLE_FAMILIES = [
  {
    id: "engineering",
    label: "Engineering & data",
    examples: [
      {
        weak: "Responsible for the payments service",
        strong:
          "Rebuilt the payments service on a queue, cutting failed charges 38% and on-call pages by half",
      },
      {
        weak: "Worked on reports for the sales team",
        strong:
          "Built a self-serve sales dashboard that replaced 12 weekly hand-made reports",
      },
    ],
  },
  {
    id: "product",
    label: "Product & design",
    examples: [
      {
        weak: "Helped with the onboarding redesign",
        strong:
          "Led onboarding redesign from research to launch; activation rose from 31% to 46% in a quarter",
      },
      {
        weak: "In charge of the design system",
        strong:
          "Created a 40-component design system adopted by 6 teams, halving UI review time",
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & marketing",
    examples: [
      {
        weak: "Duties included managing key accounts",
        strong:
          "Grew 14 key accounts from $1.2M to $1.9M ARR in 18 months with quarterly business reviews",
      },
      {
        weak: "Worked on email campaigns",
        strong:
          "Rewrote the trial email sequence, raising trial-to-paid conversion from 9% to 13%",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations & support",
    examples: [
      {
        weak: "Responsible for answering customer tickets",
        strong:
          "Resolved 60+ tickets a week at 96% satisfaction, and wrote 25 help articles that cut repeat questions",
      },
      {
        weak: "Assisted with inventory",
        strong:
          "Introduced weekly cycle counts that reduced stock discrepancies from 7% to under 1%",
      },
    ],
  },
  {
    id: "education",
    label: "Education & healthcare",
    examples: [
      {
        weak: "Taught maths to secondary students",
        strong:
          "Taught maths to 5 classes of 30; pass rate rose from 68% to 84% over two years",
      },
      {
        weak: "Involved in patient care on a busy ward",
        strong:
          "Cared for up to 8 patients a shift on a 30-bed surgical ward; trained 4 new nurses",
      },
    ],
  },
  {
    id: "early-career",
    label: "Students & graduates",
    examples: [
      {
        weak: "Helped organise events for the society",
        strong:
          "Organised 6 tech talks for a 300-member society, securing £2k in sponsorship",
      },
      {
        weak: "Did a group project on machine learning",
        strong:
          "Built the data pipeline for a 4-person ML project classifying 50k images at 92% accuracy",
      },
    ],
  },
] as const;

export type RoleFamily = (typeof ROLE_FAMILIES)[number]["id"];

/** What to do instead of each weak opener. */
const OPENER_FIXES: [RegExp, string][] = [
  [/^responsible for/i, "try Led, Ran or Owned"],
  [/^worked on/i, "try Built, Shipped or Improved"],
  [/^helped( with)?/i, "say what you did yourself: Built, Wrote, Analysed"],
  [/^assisted( with)?/i, "say what you did: Prepared, Handled, Ran"],
  [/^involved in/i, "name your part: Designed, Delivered, Tested"],
  [/^duties included/i, "state what those duties achieved"],
  [/^tasked with/i, "try Delivered or Completed"],
  [/^in charge of/i, "try Led or Managed"],
];

export interface LineReview {
  /** 1-based position among the bullets. */
  line: number;
  text: string;
  notes: string[];
}

/**
 * What could be stronger in each bullet, most important first. Lines with
 * nothing to say are left out. "Add a number" is a question, not a rule — a
 * resume where every line has one reads as padded.
 */
export function reviewBullets(description: string | undefined): LineReview[] {
  return bulletLines(description)
    .map((text, i) => {
      const notes: string[] = [];
      const opener = text.match(WEAK_OPENERS)?.[0];
      if (opener) {
        const fix =
          OPENER_FIXES.find(([re]) => re.test(text))?.[1] ??
          "start with an action verb";
        notes.push(`Starts with "${opener}" — ${fix}.`);
      }
      if (FIRST_PERSON.test(text)) notes.push('Drop "I" and "my".');
      if (words(text) > 32) notes.push("Over two lines — split or tighten.");
      if (!HAS_NUMBER.test(text))
        notes.push("Is there a number you can stand behind?");
      return { line: i + 1, text, notes };
    })
    .filter((r) => r.notes.length > 0);
}

/** Which guide a section gets, if any. */
export function guideKindFor(type: string): GuideKind | null {
  if (type === "summary") return "summary";
  if (type === "experience") return "experience";
  if (type === "projects") return "projects";
  if (type === "custom") return "custom";
  return null;
}
