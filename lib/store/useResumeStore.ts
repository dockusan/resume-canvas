import { v4 as uuidv4 } from "uuid";
import { temporal } from "zundo";
import { create } from "zustand";
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

interface ResumeState {
  resumeData: ResumeData;
  settings: ResumeSettings;
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
  renameSection: (sectionId: string, name: string) => void;
  duplicateSection: (sectionId: string) => void;
  removeSectionFromLayout: (sectionId: string) => void;
  restoreSection: (sectionId: string) => void;
  addCustomSection: () => string;

  // Style overrides (section / item / field level, keyed by path)
  setStyleOverride: (path: string, patch: Partial<StyleOverride>) => void;
  clearStyleOverride: (path: string) => void;

  updateSettings: (settings: Partial<ResumeSettings>) => void;
  resetResume: () => void;
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

// Middleware order matters: persist must wrap temporal, otherwise persist's
// synchronous rehydration `set` flows through zundo before the store state
// exists and partialize throws, silently breaking hydration.
export const useResumeStore = create<ResumeState>()(
  persist(
    temporal(
      (set) => ({
        resumeData: initialResumeData,
        settings: initialSettings,
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
              readItems(state.resumeData, section).filter(
                (it) => it.id !== id,
              ),
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
            if (
              from < 0 ||
              from >= items.length ||
              to < 0 ||
              to >= items.length
            )
              return {};
            const [moved] = items.splice(from, 1);
            items.splice(to, 0, moved);
            return { resumeData: writeItems(state.resumeData, section, items) };
          }),

        // ------- Section-level actions -------

        moveSection: (sectionId, direction) =>
          set((state) => {
            const pos = findSectionConfig(state.settings, sectionId);
            if (!pos) return {};
            const { column, index } = pos;
            const oneColumn = !["classic", "modern-2col", "creative"].includes(
              state.settings.template,
            );
            if (direction === "up" || direction === "down") {
              const target = direction === "up" ? index - 1 : index + 1;
              const list = [...state.settings[column]];
              if (target < 0 || target >= list.length) {
                // 1-col templates render [...leftColumn, ...rightColumn] as one
                // list, so crossing the array boundary must move between them.
                if (oneColumn) {
                  if (direction === "down" && column === "leftColumn") {
                    const source = [...state.settings.leftColumn];
                    const [moved] = source.splice(index, 1);
                    return {
                      settings: {
                        ...state.settings,
                        leftColumn: source,
                        rightColumn: [moved, ...state.settings.rightColumn],
                      },
                    };
                  }
                  if (direction === "up" && column === "rightColumn") {
                    const source = [...state.settings.rightColumn];
                    const [moved] = source.splice(index, 1);
                    return {
                      settings: {
                        ...state.settings,
                        leftColumn: [...state.settings.leftColumn, moved],
                        rightColumn: source,
                      },
                    };
                  }
                }
                return {};
              }
              [list[index], list[target]] = [list[target], list[index]];
              return { settings: { ...state.settings, [column]: list } };
            }
            const targetColumn =
              direction === "left" ? "leftColumn" : "rightColumn";
            if (targetColumn === column) return {};
            const source = [...state.settings[column]];
            const [moved] = source.splice(index, 1);
            const target = [...state.settings[targetColumn]];
            target.splice(Math.min(index, target.length), 0, moved);
            return {
              settings: {
                ...state.settings,
                [column]: source,
                [targetColumn]: target,
              },
            };
          }),
        toggleSectionVisibility: (sectionId) =>
          set((state) => {
            const pos = findSectionConfig(state.settings, sectionId);
            if (!pos) return {};
            const list = state.settings[pos.column].map((s) =>
              s.id === sectionId ? { ...s, visible: !s.visible } : s,
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
                customSections: [
                  ...state.resumeData.customSections,
                  newSection,
                ],
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
              state.settings.leftColumn.length <=
              state.settings.rightColumn.length
                ? "leftColumn"
                : "rightColumn";
            return {
              resumeData: {
                ...state.resumeData,
                customSections: [
                  ...state.resumeData.customSections,
                  { id: uuid, items: [{ ...DEFAULT_CUSTOM_ITEM, id: uuidv4() }] },
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
        resetResume: () =>
          set({
            resumeData: initialResumeData,
            settings: initialSettings,
          }),
        setHasHydrated: (state) => set({ _hasHydrated: state }),
      }),
      {
        partialize: (state) => ({
          resumeData: state.resumeData,
          settings: state.settings,
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
      },
    ),
    {
      name: "resume-storage",
      version: 1,
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
        return state;
      },
      // Deep-merge one level so returning users get defaults for keys
      // added after their state was persisted (zustand's default merge
      // is shallow and would drop new nested keys).
      merge: (persisted, current) => {
        const state = persisted as
          | {
              resumeData?: ResumeData;
              settings?: ResumeSettings;
            }
          | undefined;
        return {
          ...current,
          ...(state ?? {}),
          resumeData: { ...current.resumeData, ...state?.resumeData },
          settings: { ...current.settings, ...state?.settings },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Clear undo history so users can't undo past the loaded state.
        // Deferred: the store variable isn't initialized yet when
        // hydration runs synchronously from localStorage.
        setTimeout(() => {
          useResumeStore.temporal.getState().clear();
        }, 0);
      },
    },
  ),
);

/** Convenience hook for undo/redo state. */
export const useTemporalStore = useResumeStore.temporal;
