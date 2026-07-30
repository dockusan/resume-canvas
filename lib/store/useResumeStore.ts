"use client";

import { createContext, createElement, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import { temporal } from "zundo";
import { StateCreator, StoreApi, create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import {
  CustomSection,
  CustomSectionItem,
  PersonalInfo,
  ResumeData,
  ResumeSettings,
  SectionConfig,
  StyleOverride,
} from "../types";
import {
  LayoutSpec,
  PageSpec,
  Placement,
  ResumeDocument,
  SectionNode,
  Theme,
} from "../schema/document";
import {
  applyPreset,
  documentFromSettings,
  reconcileSections,
} from "../schema/migrate";

export type BuiltinSectionKey =
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "languages"
  | "certifications"
  | "strengths"
  | "socials";

/** Addresses a collection of items: a built-in section or `custom:<uuid>`. */
export type SectionKey = BuiltinSectionKey | `custom:${string}`;

export type SectionDirection = "up" | "down" | "left" | "right";

type ResumeItem = { id: string } & Record<string, unknown>;

export interface ResumeState {
  resumeData: ResumeData;
  settings: ResumeSettings;
  /**
   * v2 presentation schema. `settings` remains the source of truth for
   * section order/visibility during the migration; `document` owns page,
   * theme, layout and per-section styling. See lib/schema/.
   */
  document: ResumeDocument;
  _hasHydrated: boolean;

  // Actions
  setHasHydrated: (state: boolean) => void;
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;

  // Generic item actions (work for all built-in sections and custom sections)
  addItem: (section: SectionKey, item?: Record<string, unknown>) => string;
  updateItem: (
    section: SectionKey,
    id: string,
    patch: Record<string, unknown>,
  ) => void;
  removeItem: (section: SectionKey, id: string) => void;
  duplicateItem: (section: SectionKey, id: string) => string | null;
  reorderItem: (section: SectionKey, from: number, to: number) => void;

  // Section-level actions (operate on leftColumn/rightColumn configs)
  moveSection: (sectionId: string, direction: SectionDirection) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  toggleSectionPageBreak: (sectionId: string) => void;
  renameSection: (sectionId: string, name: string) => void;
  duplicateSection: (sectionId: string) => void;
  removeSectionFromLayout: (sectionId: string) => void;
  restoreSection: (sectionId: string) => void;
  addCustomSection: () => string;

  // Style overrides (section / item / field level, keyed by path)
  setStyleOverride: (path: string, patch: Partial<StyleOverride>) => void;
  clearStyleOverride: (path: string) => void;

  updateSettings: (settings: Partial<ResumeSettings>) => void;

  // Document schema (v2)
  updateDocument: (patch: Partial<ResumeDocument>) => void;
  updateLayout: (patch: DeepPartial<LayoutSpec>) => void;
  updateTheme: (patch: DeepPartial<Theme>) => void;
  updatePage: (patch: DeepPartial<PageSpec>) => void;
  updateSectionNode: (
    sectionId: string,
    patch: DeepPartial<SectionNode>,
  ) => void;
  setPreset: (presetId: string) => void;
  /** Single entry point for every section move: buttons, drag and page pins. */
  moveSectionTo: (
    sectionId: string,
    target: { column?: Placement; index?: number; page?: number | "auto" },
  ) => void;

  resetResume: () => void;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> | T[K] : T[K];
};

/** Merge nested plain objects; arrays and non-objects replace wholesale. */
function deepMerge<T>(base: T, patch: unknown): T {
  if (
    patch === null ||
    typeof patch !== "object" ||
    Array.isArray(patch) ||
    typeof base !== "object" ||
    base === null ||
    Array.isArray(base)
  ) {
    return (patch === undefined ? base : (patch as T)) as T;
  }
  const out = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    out[key] = deepMerge(out[key], value);
  }
  return out as T;
}

export const DEFAULT_SECTION_NAMES: Record<string, string> = {
  summary: "Summary",
  experience: "Work Experience",
  education: "Education",
  projects: "Projects",
  strengths: "Strengths",
  skills: "Skills",
  socials: "Find Me Online",
  languages: "Languages",
  certifications: "Certification",
};

/** Which column a built-in section lives in by default (for restore). */
const DEFAULT_SECTION_COLUMN: Record<string, "leftColumn" | "rightColumn"> = {
  summary: "leftColumn",
  experience: "leftColumn",
  education: "leftColumn",
  projects: "leftColumn",
  strengths: "rightColumn",
  skills: "rightColumn",
  socials: "rightColumn",
  languages: "rightColumn",
  certifications: "rightColumn",
};

/** Defaults for newly added items, per section. */
const DEFAULT_ITEMS: Record<BuiltinSectionKey, Record<string, unknown>> = {
  experience: {
    title: "New Position",
    company: "Company Name",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  },
  education: {
    degree: "Degree",
    school: "School Name",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
  },
  projects: { name: "New Project", link: "", date: "", description: "" },
  skills: { name: "New Skill" },
  languages: { name: "Language", proficiency: "Basic" },
  certifications: { name: "New Certification", issuer: "", date: "" },
  strengths: { title: "New Strength", description: "", icon: "Zap" },
  socials: { platform: "Website", url: "", username: "", icon: "Globe" },
};

const DEFAULT_CUSTOM_ITEM: Omit<CustomSectionItem, "id"> = {
  title: "",
  subtitle: "",
  date: "",
  description: "",
};

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: "John Doe",
    title: "Senior Software Engineer",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
    twitter: "https://twitter.com/johndoe",
    summary:
      "Experienced Software Engineer with a passion for building scalable web applications. Proficient in modern JavaScript frameworks, cloud infrastructure, and system design. Dedicated to writing clean, maintainable code and mentoring junior developers.",
    photoUrl: "",
  },
  experience: [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      location: "San Francisco, CA",
      startDate: "2022-01",
      endDate: "",
      current: true,
      description:
        "• Led the migration of legacy monolith to microservices architecture.\n• Improved application performance by 40% through code optimization.\n• Mentored junior developers and conducted code reviews.",
    },
    {
      id: "2",
      title: "Software Engineer",
      company: "StartUp Innovations",
      location: "New York, NY",
      startDate: "2019-03",
      endDate: "2021-12",
      current: false,
      description:
        "• Developed and maintained key features for the flagship product.\n• Collaborated with product managers to define requirements.\n• Implemented automated testing pipeline reducing bugs by 25%.",
    },
  ],
  education: [
    {
      id: "1",
      degree: "Master of Science in Computer Science",
      school: "Stanford University",
      location: "Stanford, CA",
      startDate: "2017-09",
      endDate: "2019-06",
      current: false,
    },
    {
      id: "2",
      degree: "Bachelor of Science in Computer Science",
      school: "University of California, Berkeley",
      location: "Berkeley, CA",
      startDate: "2013-09",
      endDate: "2017-05",
      current: false,
    },
  ],
  projects: [
    {
      id: "1",
      name: "E-commerce Platform",
      link: "https://github.com/johndoe/ecommerce",
      date: "2023",
      description:
        "A full-featured e-commerce platform built with Next.js, Stripe, and PostgreSQL.",
    },
    {
      id: "2",
      name: "Task Management App",
      link: "https://github.com/johndoe/taskmanager",
      date: "2022",
      description:
        "Real-time task management application using React, Firebase, and Tailwind CSS.",
    },
  ],
  skills: [
    { id: "1", name: "JavaScript" },
    { id: "2", name: "TypeScript" },
    { id: "3", name: "React" },
    { id: "4", name: "Next.js" },
    { id: "5", name: "Node.js" },
    { id: "6", name: "Python" },
    { id: "7", name: "AWS" },
    { id: "8", name: "Docker" },
    { id: "9", name: "PostgreSQL" },
    { id: "10", name: "GraphQL" },
  ],
  languages: [
    { id: "1", name: "English", proficiency: "Native" },
    { id: "2", name: "Spanish", proficiency: "Intermediate" },
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023",
      link: "https://aws.amazon.com/certification/",
    },
  ],
  strengths: [
    {
      id: "1",
      title: "Problem Solving",
      description:
        "Strong analytical skills with a proven ability to solve complex technical challenges.",
    },
    {
      id: "2",
      title: "Leadership",
      description:
        "Experience leading teams and driving technical initiatives to completion.",
    },
  ],
  socials: [
    {
      id: "1",
      platform: "Github",
      url: "https://github.com/johndoe",
      username: "johndoe",
    },
    {
      id: "2",
      platform: "Linkedin",
      url: "https://linkedin.com/in/johndoe",
      username: "johndoe",
    },
    {
      id: "3",
      platform: "Twitter",
      url: "https://twitter.com/johndoe",
      username: "johndoe",
    },
  ],
  customSections: [],
};

const initialSettings: ResumeSettings = {
  themeColor: "#23405c", // Deep Blue
  fontFamily: "'Khand', sans-serif",
  fontSize: "md",
  documentSize: "A4",
  template: "classic",
  leftColumn: [
    { id: "summary", name: "Summary", visible: true },
    { id: "experience", name: "Work Experience", visible: true },
    { id: "education", name: "Education", visible: true },
    { id: "projects", name: "Projects", visible: true },
  ],
  rightColumn: [
    { id: "strengths", name: "Strengths", visible: true },
    { id: "skills", name: "Skills", visible: true },
    { id: "socials", name: "Find Me Online", visible: true },
    { id: "languages", name: "Languages", visible: true },
    { id: "certifications", name: "Certification", visible: true },
  ],
  styleOverrides: {},
  showPhoto: true,
  photoStyle: "circle",
  personalFieldVisibility: {},
  showContactIcons: true,
};

export const isCustomSectionId = (id: string): id is `custom:${string}` =>
  id.startsWith("custom:");

export const customSectionUuid = (id: string) => id.slice("custom:".length);

function readItems(data: ResumeData, section: SectionKey): ResumeItem[] {
  if (isCustomSectionId(section)) {
    const custom = data.customSections.find(
      (c) => c.id === customSectionUuid(section),
    );
    return (custom?.items ?? []) as ResumeItem[];
  }
  return data[section] as unknown as ResumeItem[];
}

function writeItems(
  data: ResumeData,
  section: SectionKey,
  items: ResumeItem[],
): ResumeData {
  if (isCustomSectionId(section)) {
    const uuid = customSectionUuid(section);
    return {
      ...data,
      customSections: data.customSections.map((c) =>
        c.id === uuid ? { ...c, items: items as CustomSectionItem[] } : c,
      ),
    };
  }
  return { ...data, [section]: items };
}

function findSectionConfig(
  settings: ResumeSettings,
  sectionId: string,
): { column: "leftColumn" | "rightColumn"; index: number } | null {
  const left = settings.leftColumn.findIndex((s) => s.id === sectionId);
  if (left !== -1) return { column: "leftColumn", index: left };
  const right = settings.rightColumn.findIndex((s) => s.id === sectionId);
  if (right !== -1) return { column: "rightColumn", index: right };
  return null;
}

function formatDateRange(start: string, end: string, current: boolean): string {
  if (!start && !end && !current) return "";
  return `${start}${start || end || current ? " - " : ""}${current ? "Present" : end}`;
}

/** Snapshot a built-in section's data as generic custom-section items. */
function builtinToCustomItems(
  data: ResumeData,
  sectionId: string,
): CustomSectionItem[] {
  switch (sectionId) {
    case "summary":
      return [{ id: uuidv4(), description: data.personalInfo.summary }];
    case "experience":
      return data.experience.map((exp) => ({
        id: uuidv4(),
        title: exp.title,
        subtitle: [exp.company, exp.location].filter(Boolean).join(" • "),
        date: formatDateRange(exp.startDate, exp.endDate, exp.current),
        description: exp.description,
        bulletStyle: exp.bulletStyle,
      }));
    case "education":
      return data.education.map((edu) => ({
        id: uuidv4(),
        title: edu.degree,
        subtitle: [edu.school, edu.location].filter(Boolean).join(" • "),
        date: formatDateRange(edu.startDate, edu.endDate, edu.current),
      }));
    case "projects":
      return data.projects.map((proj) => ({
        id: uuidv4(),
        title: proj.name,
        link: proj.link,
        date: proj.date,
        description: proj.description,
      }));
    case "skills":
      return data.skills.map((s) => ({ id: uuidv4(), title: s.name }));
    case "languages":
      return data.languages.map((l) => ({
        id: uuidv4(),
        title: l.name,
        subtitle: l.proficiency,
      }));
    case "certifications":
      return data.certifications.map((c) => ({
        id: uuidv4(),
        title: c.name,
        subtitle: c.issuer,
        date: c.date,
        link: c.link,
        description: c.description,
      }));
    case "strengths":
      return data.strengths.map((s) => ({
        id: uuidv4(),
        title: s.title,
        description: s.description,
        icon: s.icon,
      }));
    case "socials":
      return data.socials.map((s) => ({
        id: uuidv4(),
        title: s.platform,
        subtitle: s.username,
        link: s.url,
        icon: s.icon,
      }));
    default:
      return [];
  }
}

/**
 * Every piece of resume state and behaviour, independent of how it is stored.
 *
 * Extracted from the store so the same logic can back both the persisted
 * editor store and a throwaway one built from a share link — see
 * `createDetachedStore`.
 */
const createResumeState: StateCreator<ResumeState, [], []> = (set, get) => ({
  resumeData: initialResumeData,
  settings: initialSettings,
  document: documentFromSettings(initialSettings),
  _hasHydrated: false,

  setPersonalInfo: (info) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        personalInfo: { ...state.resumeData.personalInfo, ...info },
      },
    })),

  // ------- Generic item actions -------

  addItem: (section, item) => {
    const id = uuidv4();
    set((state) => {
      const defaults = isCustomSectionId(section)
        ? DEFAULT_CUSTOM_ITEM
        : DEFAULT_ITEMS[section];
      const items = readItems(state.resumeData, section);
      return {
        resumeData: writeItems(state.resumeData, section, [
          ...items,
          { ...defaults, ...item, id },
        ]),
      };
    });
    return id;
  },
  updateItem: (section, id, patch) =>
    set((state) => ({
      resumeData: writeItems(
        state.resumeData,
        section,
        readItems(state.resumeData, section).map((it) =>
          it.id === id ? { ...it, ...patch } : it,
        ),
      ),
    })),
  removeItem: (section, id) =>
    set((state) => ({
      resumeData: writeItems(
        state.resumeData,
        section,
        readItems(state.resumeData, section).filter((it) => it.id !== id),
      ),
    })),
  duplicateItem: (section, id) => {
    const newId = uuidv4();
    let found = false;
    set((state) => {
      const items = readItems(state.resumeData, section);
      const index = items.findIndex((it) => it.id === id);
      if (index === -1) return {};
      found = true;
      const copy = { ...items[index], id: newId };
      const next = [...items];
      next.splice(index + 1, 0, copy);
      return { resumeData: writeItems(state.resumeData, section, next) };
    });
    return found ? newId : null;
  },
  reorderItem: (section, from, to) =>
    set((state) => {
      const items = [...readItems(state.resumeData, section)];
      if (from < 0 || from >= items.length || to < 0 || to >= items.length)
        return {};
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { resumeData: writeItems(state.resumeData, section, items) };
    }),

  // ------- Section-level actions -------

  // Arrow buttons and drag-and-drop share one implementation, so they
  // can never disagree about what "move left" means.
  moveSection: (sectionId, direction) => {
    const { document: doc, moveSectionTo } = get();
    const node = doc.sections.find((s) => s.id === sectionId);
    if (!node) return;
    const singleColumn = doc.layout.columns === 1;
    const column = singleColumn
      ? ("full" as const)
      : node.placement.column === "full"
        ? ("left" as const)
        : node.placement.column;

    if (direction === "left" || direction === "right") {
      if (singleColumn) return;
      const target = direction === "left" ? "left" : "right";
      if (target === column) return;
      moveSectionTo(sectionId, { column: target });
      return;
    }

    const siblings = doc.sections
      .filter(
        (s) =>
          s.visible && (singleColumn ? true : s.placement.column === column),
      )
      .sort((a, b) => a.placement.order - b.placement.order);
    const index = siblings.findIndex((s) => s.id === sectionId);
    if (index < 0) return;
    const next = direction === "up" ? index - 1 : index + 1;
    if (next < 0 || next >= siblings.length) return;
    moveSectionTo(sectionId, { column, index: next });
  },
  toggleSectionVisibility: (sectionId) =>
    set((state) => {
      const pos = findSectionConfig(state.settings, sectionId);
      if (!pos) return {};
      const list = state.settings[pos.column].map((s) =>
        s.id === sectionId ? { ...s, visible: !s.visible } : s,
      );
      return { settings: { ...state.settings, [pos.column]: list } };
    }),
  toggleSectionPageBreak: (sectionId) =>
    set((state) => {
      const pos = findSectionConfig(state.settings, sectionId);
      if (!pos) return {};
      const list = state.settings[pos.column].map((s) =>
        s.id === sectionId ? { ...s, pageBreakBefore: !s.pageBreakBefore } : s,
      );
      return { settings: { ...state.settings, [pos.column]: list } };
    }),
  renameSection: (sectionId, name) =>
    set((state) => {
      const pos = findSectionConfig(state.settings, sectionId);
      if (!pos) return {};
      const list = state.settings[pos.column].map((s) =>
        s.id === sectionId ? { ...s, name } : s,
      );
      return { settings: { ...state.settings, [pos.column]: list } };
    }),
  duplicateSection: (sectionId) =>
    set((state) => {
      const pos = findSectionConfig(state.settings, sectionId);
      if (!pos) return {};
      const config = state.settings[pos.column][pos.index];
      const uuid = uuidv4();
      const items = isCustomSectionId(sectionId)
        ? readItems(state.resumeData, sectionId).map((it) => ({
            ...it,
            id: uuidv4(),
          }))
        : builtinToCustomItems(state.resumeData, sectionId);
      const newSection: CustomSection = {
        id: uuid,
        items: items as CustomSectionItem[],
      };
      const list = [...state.settings[pos.column]];
      list.splice(pos.index + 1, 0, {
        id: `custom:${uuid}`,
        name: `${config.name} (Copy)`,
        visible: true,
      });
      return {
        resumeData: {
          ...state.resumeData,
          customSections: [...state.resumeData.customSections, newSection],
        },
        settings: { ...state.settings, [pos.column]: list },
      };
    }),
  removeSectionFromLayout: (sectionId) =>
    set((state) => {
      const pos = findSectionConfig(state.settings, sectionId);
      if (!pos) return {};
      const settings = {
        ...state.settings,
        [pos.column]: state.settings[pos.column].filter(
          (s) => s.id !== sectionId,
        ),
      };
      if (isCustomSectionId(sectionId)) {
        const uuid = customSectionUuid(sectionId);
        return {
          settings,
          resumeData: {
            ...state.resumeData,
            customSections: state.resumeData.customSections.filter(
              (c) => c.id !== uuid,
            ),
          },
        };
      }
      return { settings };
    }),
  restoreSection: (sectionId) =>
    set((state) => {
      if (findSectionConfig(state.settings, sectionId)) return {};
      const column = DEFAULT_SECTION_COLUMN[sectionId] ?? "rightColumn";
      return {
        settings: {
          ...state.settings,
          [column]: [
            ...state.settings[column],
            {
              id: sectionId,
              name: DEFAULT_SECTION_NAMES[sectionId] ?? sectionId,
              visible: true,
            },
          ],
        },
      };
    }),
  addCustomSection: () => {
    const uuid = uuidv4();
    set((state) => {
      const column =
        state.settings.leftColumn.length <= state.settings.rightColumn.length
          ? "leftColumn"
          : "rightColumn";
      return {
        resumeData: {
          ...state.resumeData,
          customSections: [
            ...state.resumeData.customSections,
            {
              id: uuid,
              items: [{ ...DEFAULT_CUSTOM_ITEM, id: uuidv4() }],
            },
          ],
        },
        settings: {
          ...state.settings,
          [column]: [
            ...state.settings[column],
            { id: `custom:${uuid}`, name: "New Section", visible: true },
          ],
        },
      };
    });
    return `custom:${uuid}`;
  },

  // ------- Style overrides -------

  setStyleOverride: (path, patch) =>
    set((state) => {
      const merged: StyleOverride = {
        ...state.settings.styleOverrides[path],
        ...patch,
      };
      (Object.keys(merged) as (keyof StyleOverride)[]).forEach((key) => {
        if (merged[key] === undefined) delete merged[key];
      });
      const styleOverrides = { ...state.settings.styleOverrides };
      if (Object.keys(merged).length === 0) delete styleOverrides[path];
      else styleOverrides[path] = merged;
      return { settings: { ...state.settings, styleOverrides } };
    }),
  clearStyleOverride: (path) =>
    set((state) => {
      if (!(path in state.settings.styleOverrides)) return {};
      const styleOverrides = { ...state.settings.styleOverrides };
      delete styleOverrides[path];
      return { settings: { ...state.settings, styleOverrides } };
    }),

  updateSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),

  // ------- Document schema (v2) -------

  updateDocument: (patch) =>
    set((state) => ({ document: { ...state.document, ...patch } })),
  updateLayout: (patch) =>
    set((state) => ({
      document: {
        ...state.document,
        layout: deepMerge(state.document.layout, patch),
      },
    })),
  updateTheme: (patch) =>
    set((state) => ({
      document: {
        ...state.document,
        theme: deepMerge(state.document.theme, patch),
      },
    })),
  updatePage: (patch) =>
    set((state) => ({
      document: {
        ...state.document,
        page: deepMerge(state.document.page, patch),
      },
    })),
  updateSectionNode: (sectionId, patch) =>
    set((state) => ({
      document: {
        ...state.document,
        sections: state.document.sections.map((s) =>
          s.id === sectionId ? deepMerge(s, patch) : s,
        ),
      },
    })),
  moveSectionTo: (sectionId, target) =>
    set((state) => {
      // Reconcile first: a section added or restored in the same tick
      // exists in `settings` but not yet in `document.sections`, and
      // moving a node that isn't there yet would silently do nothing —
      // which is why "add here" in the right column landed on the left.
      const doc = reconcileSections(state.document, state.settings);
      const moving = doc.sections.find((s) => s.id === sectionId);
      if (!moving) return {};

      const singleColumn = doc.layout.columns === 1;
      const column: Placement =
        target.column ?? (singleColumn ? "full" : moving.placement.column);
      const page = target.page ?? moving.placement.page;

      // Rebuild the destination column's order around the insert point,
      // then renumber every column so orders stay dense and comparable.
      const inColumn = doc.sections
        .filter(
          (s) =>
            s.id !== sectionId &&
            (singleColumn ? true : s.placement.column === column),
        )
        .sort((a, b) => a.placement.order - b.placement.order);

      const index = Math.max(
        0,
        Math.min(target.index ?? inColumn.length, inColumn.length),
      );
      const ordered = [
        ...inColumn.slice(0, index),
        moving,
        ...inColumn.slice(index),
      ];
      const orderById = new Map(ordered.map((s, i) => [s.id, i]));

      const sections = doc.sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            placement: {
              column,
              page,
              order: orderById.get(s.id) ?? s.placement.order,
            },
          };
        }
        const next = orderById.get(s.id);
        return next === undefined
          ? s
          : { ...s, placement: { ...s.placement, order: next } };
      });

      return { document: { ...doc, sections } };
    }),
  setPreset: (presetId) =>
    set((state) => ({
      document: applyPreset(state.document, presetId),
      settings: { ...state.settings, template: presetId as never },
    })),

  resetResume: () =>
    set({
      resumeData: initialResumeData,
      settings: initialSettings,
      document: documentFromSettings(initialSettings),
    }),
  setHasHydrated: (state) => set({ _hasHydrated: state }),
});

// Middleware order matters: persist must wrap temporal, otherwise persist's
// synchronous rehydration `set` flows through zundo before the store state
// exists and partialize throws, silently breaking hydration.
function createPersistedStore() {
  return create<ResumeState>()(
    persist(
      temporal(createResumeState, {
        partialize: (state) => ({
          resumeData: state.resumeData,
          settings: state.settings,
          document: state.document,
        }),
        limit: 100,
        equality: (past, current) =>
          JSON.stringify(past) === JSON.stringify(current),
        // Group rapid successive writes (e.g. color dragging) into one
        // history entry: only record a snapshot every 300ms.
        handleSet: (handleSet) => {
          let lastRecorded = 0;
          return (pastState) => {
            const now = Date.now();
            if (now - lastRecorded > 300) {
              lastRecorded = now;
              handleSet(pastState);
            }
          };
        },
      }),
      {
        name: "resume-storage",
        version: 2,
        migrate: (persisted: unknown) => {
          const state = persisted as {
            resumeData?: Partial<ResumeData> & {
              customSections?: CustomSection[];
            };
            settings?: Partial<ResumeSettings> & {
              sectionTypography?: unknown;
            };
          };
          if (state?.resumeData && !state.resumeData.customSections) {
            state.resumeData.customSections = [];
          }
          if (state?.settings) {
            delete state.settings.sectionTypography;
            if (!state.settings.styleOverrides)
              state.settings.styleOverrides = {};
            if (state.settings.showPhoto === undefined)
              state.settings.showPhoto = true;
            const fillNames = (list?: SectionConfig[]) =>
              list?.map((s) => ({
                ...s,
                name: s.name || DEFAULT_SECTION_NAMES[s.id] || s.id,
              }));
            state.settings.leftColumn = fillNames(state.settings.leftColumn);
            state.settings.rightColumn = fillNames(state.settings.rightColumn);
          }
          // v1 → v2: derive the presentation schema from the old template +
          // column settings. Existing accent colour, page size, photo and
          // per-section flags all carry over; nothing is lost.
          const withDoc = state as typeof state & { document?: ResumeDocument };
          if (state?.settings && !withDoc.document) {
            withDoc.document = documentFromSettings(
              state.settings as ResumeSettings,
            );
          }
          return withDoc;
        },
        // Deep-merge one level so returning users get defaults for keys
        // added after their state was persisted (zustand's default merge
        // is shallow and would drop new nested keys).
        merge: (persisted, current) => {
          const state = persisted as
            | {
                resumeData?: ResumeData;
                settings?: ResumeSettings;
                document?: ResumeDocument;
              }
            | undefined;
          const settings = { ...current.settings, ...state?.settings };
          // A document persisted before a schema field was added is filled in
          // from the preset it was seeded from, so new keys are never undefined.
          const document = state?.document
            ? deepMerge(documentFromSettings(settings), state.document)
            : documentFromSettings(settings);
          return {
            ...current,
            ...(state ?? {}),
            resumeData: { ...current.resumeData, ...state?.resumeData },
            settings,
            document,
          };
        },
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
          // Clear undo history so users can't undo past the loaded state.
          // Deferred: the store variable isn't initialized yet when
          // hydration runs synchronously from localStorage.
          setTimeout(() => {
            resumeStore().temporal.getState().clear();
          }, 0);
        },
      },
    ),
  );
}

type PersistedResumeStore = ReturnType<typeof createPersistedStore>;

let persisted: PersistedResumeStore | null = null;

/**
 * The user's own resume store, created on first use.
 *
 * Creating it rehydrates from (and writes back to) localStorage, so the
 * shared-resume viewer must never reach this — it renders someone else's
 * document through a detached store instead. Deferring construction is what
 * makes "opening a share link does not touch your saved work" true rather
 * than merely intended.
 */
export function resumeStore(): PersistedResumeStore {
  return (persisted ??= createPersistedStore());
}

/**
 * A store that holds a resume but is wired to nothing: no localStorage, no
 * undo history. Used to render a document that isn't the visitor's own.
 */
export function createDetachedStore(
  initial: Pick<ResumeState, "resumeData" | "settings" | "document">,
): StoreApi<ResumeState> {
  const store = create<ResumeState>()(createResumeState);
  store.setState({ ...initial, _hasHydrated: true });
  return store;
}

const StoreContext = createContext<StoreApi<ResumeState> | null>(null);

/**
 * Points every component below at a different store. Without a provider the
 * hook reads the persisted store, which is what the builder wants.
 */
export function ResumeStoreProvider({
  store,
  children,
}: {
  store: StoreApi<ResumeState>;
  children: React.ReactNode;
}) {
  return createElement(StoreContext.Provider, { value: store }, children);
}

export function useResumeStore(): ResumeState;
export function useResumeStore<T>(selector: (state: ResumeState) => T): T;
export function useResumeStore<T>(selector?: (state: ResumeState) => T) {
  const override = useContext(StoreContext);
  return useStore(
    override ?? resumeStore(),
    selector ?? ((state: ResumeState) => state as unknown as T),
  );
}
