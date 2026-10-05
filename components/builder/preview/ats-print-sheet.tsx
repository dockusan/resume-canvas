"use client";

import { EditingProvider } from "@/components/builder/inline/editing-context";
import { PAGE_DIMENSIONS } from "@/lib/schema/document";
import { applyPreset, reconcileSections } from "@/lib/schema/migrate";
import { normalizeFontFamily } from "@/lib/schema/style-presets";
import {
  ResumeStoreProvider,
  createDetachedStore,
  useResumeStore,
} from "@/lib/store/useResumeStore";
import { useMemo } from "react";
import { PaginatedResume } from "./canvas/paginated-resume";
import { AtsFlowContext } from "./sections/ats-flow";

/**
 * The ATS-safe rendition of the resume: the same content re-flowed through
 * the Clean template (one column, no photo, no icons), rendered off-screen and
 * printed in place of the designed sheet while `html.rc-print-ats` is set.
 *
 * It renders from a detached copy of the store, so producing it never
 * touches the user's document or undo history.
 */
export function AtsPrintSheet() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const settings = useResumeStore((s) => s.settings);
  const document = useResumeStore((s) => s.document);

  const store = useMemo(() => {
    const clean = applyPreset(
      reconcileSections(document, settings),
      "clean",
      settings.themeColor || document.theme.colors.accent,
    );
    // Tracked capitals are extracted letter by letter ("S U M M A R Y"),
    // which can stop a parser recognising the heading at all.
    const flat = {
      ...clean,
      theme: {
        ...clean.theme,
        fonts: {
          ...clean.theme.fonts,
          heading: { ...clean.theme.fonts.heading, letterSpacing: 0 },
        },
      },
      sections: clean.sections.map((s) => ({
        ...s,
        style: {
          ...s.style,
          heading: {
            ...s.style.heading,
            font: { ...s.style.heading.font, letterSpacing: 0 },
          },
        },
      })),
    };
    return createDetachedStore({
      resumeData,
      settings: { ...settings, showPhoto: false, showContactIcons: false },
      document: flat,
    });
  }, [resumeData, settings, document]);

  const width = PAGE_DIMENSIONS[document.page.size].width;

  return (
    <div
      data-ats-print-root
      aria-hidden
      className="fixed top-0 pointer-events-none"
      style={{
        left: -100000,
        width,
        fontFamily: normalizeFontFamily(settings.fontFamily),
      }}
    >
      <ResumeStoreProvider store={store}>
        <EditingProvider editable={false}>
          <AtsFlowContext.Provider value>
            <PaginatedResume />
          </AtsFlowContext.Provider>
        </EditingProvider>
      </ResumeStoreProvider>
    </div>
  );
}
