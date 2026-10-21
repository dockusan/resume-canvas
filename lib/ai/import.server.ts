/**
 * Reading an existing resume into the editor's structure.
 */

import { JsonSchema } from "./openrouter.server";
import {
  DATE_RULE,
  bullets,
  draftItem,
  draftItemSchema,
  line,
  list,
  looseDate,
  month,
  obj,
  proficiency,
  prose,
  s,
  url,
} from "./sanitize.server";
import { ImportedResume, PROFICIENCIES } from "./types";

export const IMPORT_SYSTEM = `You convert a resume into structured data for a resume builder.

The text was extracted from a PDF or a text file, so the reading order may be scrambled: columns interleaved, headings separated from their content, headers and footers repeated on every page. Reassemble it by meaning.

Rules:
- Copy, don't compose. Never invent employers, titles, dates, degrees, numbers, links or skills. Use "" (or an empty list) for anything the resume doesn't state.
- Keep the resume's own language and wording. Only repair extraction damage: words broken across lines, stray page numbers, duplicated headers.
- Dates: ${DATE_RULE} An ongoing role or study ("Present", "Now", "Current", "Hiện tại", "Heute"…) has current = true and endDate "".
- bullets: one achievement or responsibility per string, without bullet characters. A role described as a paragraph becomes its sentences.
- personalInfo.title is the professional headline. If the resume has none, use the most recent job title.
- personalInfo.summary is the profile / summary / objective paragraph, or "".
- Links: put LinkedIn, GitHub and X/Twitter in their personalInfo fields and a personal site or portfolio in website, as full URLs. Other profiles (Behance, Dribbble, Stack Overflow, Medium…) go in profiles. The text may end with a list of hyperlinks found in the file; use them to recover addresses hidden behind link text.
- skills: individual, short names ("PostgreSQL", "Stakeholder management"), not sentences. Flatten grouped lists ("Backend: Go, Java" → "Go", "Java").
- languages: spoken languages only, with the closest proficiency level.
- strengths: only when the resume has a strengths / key qualities section.
- Anything else (awards, volunteering, publications, activities, courses, interests, references) goes in otherSections under its original heading, one entry per item.`;

const str = s.string;

export const IMPORT_FORMAT: JsonSchema = {
  name: "resume",
  schema: s.object({
    personalInfo: s.object({
      fullName: str(),
      title: str("Professional headline."),
      email: str(),
      phone: str(),
      location: str("City and country, as written."),
      website: str(),
      linkedin: str(),
      github: str(),
      twitter: str(),
      summary: str(),
    }),
    experience: s.array(
      s.object({
        title: str("Job title."),
        company: str(),
        location: str(),
        startDate: str(DATE_RULE),
        endDate: str(DATE_RULE),
        current: s.boolean(),
        bullets: s.array(str()),
      }),
      "Most recent first, as in the resume.",
    ),
    education: s.array(
      s.object({
        degree: str('Degree and field, e.g. "BSc Computer Science".'),
        school: str(),
        location: str(),
        startDate: str(DATE_RULE),
        endDate: str(DATE_RULE),
        current: s.boolean(),
      }),
    ),
    projects: s.array(
      s.object({
        name: str(),
        link: str(),
        date: str("Year or date range, as written."),
        bullets: s.array(str()),
      }),
    ),
    skills: s.array(str()),
    languages: s.array(
      s.object({ name: str(), proficiency: s.enum(PROFICIENCIES) }),
    ),
    certifications: s.array(
      s.object({
        name: str(),
        issuer: str(),
        date: str("Year or date, as written."),
        link: str(),
      }),
    ),
    strengths: s.array(s.object({ title: str(), description: str() })),
    profiles: s.array(
      s.object({ platform: str(), url: str(), username: str() }),
    ),
    otherSections: s.array(
      s.object({
        title: str("The section's heading in the resume."),
        entries: s.array(
          draftItemSchema(
            "title is the item's name; subtitle its organisation or issuer.",
          ),
        ),
      }),
    ),
  }),
};

/** Validate and trim a reply into exactly the shape the editor expects. */
export function normalizeImport(raw: unknown): ImportedResume {
  const r = obj(raw);
  const p = obj(r.personalInfo);

  return {
    personalInfo: {
      fullName: line(p.fullName, 120),
      title: line(p.title, 160),
      email: line(p.email, 160),
      phone: line(p.phone, 60),
      location: line(p.location, 120),
      website: url(p.website),
      linkedin: url(p.linkedin),
      github: url(p.github),
      twitter: url(p.twitter),
      summary: prose(p.summary, 2000),
    },
    experience: list(r.experience, 30).map((value) => {
      const e = obj(value);
      const current = e.current === true;
      return {
        title: line(e.title),
        company: line(e.company),
        location: line(e.location, 100),
        startDate: month(e.startDate),
        endDate: current ? "" : month(e.endDate),
        current,
        bullets: bullets(e.bullets, 15),
      };
    }),
    education: list(r.education, 15).map((value) => {
      const e = obj(value);
      const current = e.current === true;
      return {
        degree: line(e.degree),
        school: line(e.school),
        location: line(e.location, 100),
        startDate: month(e.startDate),
        endDate: current ? "" : month(e.endDate),
        current,
      };
    }),
    projects: list(r.projects, 20).map((value) => {
      const e = obj(value);
      return {
        name: line(e.name),
        link: url(e.link),
        date: looseDate(e.date),
        bullets: bullets(e.bullets),
      };
    }),
    // First spelling wins: "Go" and "go" are one skill.
    skills: list(r.skills, 80)
      .map((v) => line(v, 60))
      .filter(
        (name, i, all) =>
          name &&
          all.findIndex((n) => n.toLowerCase() === name.toLowerCase()) === i,
      ),
    languages: list(r.languages, 15).map((value) => {
      const e = obj(value);
      return {
        name: line(e.name, 60),
        proficiency: proficiency(e.proficiency),
      };
    }),
    certifications: list(r.certifications, 30).map((value) => {
      const e = obj(value);
      return {
        name: line(e.name),
        issuer: line(e.issuer),
        date: looseDate(e.date),
        link: url(e.link),
      };
    }),
    strengths: list(r.strengths, 12).map((value) => {
      const e = obj(value);
      return {
        title: line(e.title, 100),
        description: prose(e.description, 500),
      };
    }),
    profiles: list(r.profiles, 12)
      .map((value) => {
        const e = obj(value);
        return {
          platform: line(e.platform, 40),
          url: url(e.url),
          username: line(e.username, 80),
        };
      })
      .filter((e) => e.url || e.username),
    otherSections: list(r.otherSections, 10)
      .map((value) => {
        const e = obj(value);
        return {
          title: line(e.title, 80),
          entries: list(e.entries, 30).map(draftItem),
        };
      })
      .filter((e) => e.title && e.entries.length),
  };
}
