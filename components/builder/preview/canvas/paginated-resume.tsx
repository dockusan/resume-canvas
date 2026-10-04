"use client";

import { useEffect, useRef } from "react";
import { ResumeDocument, SectionNode } from "@/lib/schema/document";
import { contentHeight, isDarkFill, pageDimensions } from "@/lib/schema/css";
import { effectiveColumn, useDocument } from "@/lib/schema/use-document";
import { useEditing } from "@/components/builder/inline/editing-context";
import { fontStyle } from "@/lib/schema/css";
import { fontSizeAt, spacingOf } from "@/lib/schema/document";
import {
  ColumnKey,
  PageModel,
  distribute,
  trimEmptyPages,
} from "@/lib/pagination/distribute";
import { useMeasuredSections } from "@/lib/pagination/use-measure";

import { CertificationsSection } from "../sections/certifications-section";
import { CustomSectionRenderer } from "../sections/custom-section";
import { EducationSection } from "../sections/education-section";
import { ExperienceSection } from "../sections/experience-section";
import { LanguagesSection } from "../sections/languages-section";
import { ProjectsSection } from "../sections/projects-section";
import { SkillsSection } from "../sections/skills-section";
import { SocialsSection } from "../sections/socials-section";
import { StrengthsSection } from "../sections/strengths-section";
import { SummarySection } from "../sections/summary-section";
import { PageCanvas } from "./page-canvas";

const RENDERERS = {
  summary: SummarySection,
  experience: ExperienceSection,
  education: EducationSection,
  projects: ProjectsSection,
  strengths: StrengthsSection,
  skills: SkillsSection,
  socials: SocialsSection,
  languages: LanguagesSection,
  certifications: CertificationsSection,
  custom: CustomSectionRenderer,
} as const;

export interface PaginatedResumeProps {
  doc?: ResumeDocument;
  /** Rendered in the free space at the foot of a column. */
  columnFooter?: (
    column: ColumnKey,
    pageIndex: number,
    freeSpace: number,
    sectionCount: number,
  ) => React.ReactNode;
  /** Notified whenever the page count changes. */
  onPageCount?: (count: number) => void;
  /** Wraps each page box (the editor adds a shadow and a page label). */
  pageWrapper?: (
    page: React.ReactNode,
    index: number,
    total: number,
  ) => React.ReactNode;
}

/**
 * The document laid out across real page boxes.
 *
 * Renders twice: once into a hidden measure layer at true column widths, and
 * once into the visible pages using the distribution those measurements
 * produce. The hidden layer is what makes "where does page 2 start" a fact
 * rather than an estimate.
 */
export function PaginatedResume({
  doc: docProp,
  columnFooter,
  pageWrapper,
  onPageCount,
}: PaginatedResumeProps) {
  const live = useDocument();
  const doc = docProp ?? live;
  const layerRef = useRef<HTMLDivElement>(null);
  const { setActivePath } = useEditing();
  const { measured, chrome, ready } = useMeasuredSections(layerRef, doc);

  const dims = pageDimensions(doc.page);
  const usable = contentHeight(doc.page);

  const renderSection = (
    node: SectionNode,
    itemRange?: [number, number],
    continued?: boolean,
  ) => {
    const column = effectiveColumn(doc, node) === "right" ? "right" : "left";
    const Renderer = RENDERERS[node.type] ?? RENDERERS.custom;
    return (
      <Renderer
        key={`${node.id}-${itemRange?.[0] ?? 0}`}
        node={node}
        theme={doc.theme}
        onFill={isDarkFill(doc.layout.fills[column])}
        itemRange={itemRange}
        continued={continued}
      />
    );
  };

  // Page one is shorter wherever the header band or a pinned portrait sits.
  const heightFor = (column: ColumnKey, pageIndex: number) => {
    const padKey = column === "full" ? "left" : column;
    let height = usable - chrome.columnPadding[padKey];
    if (pageIndex === 0) {
      const headerHitsColumn =
        chrome.headerColumn === "band" ||
        chrome.headerColumn === column ||
        (column === "full" && chrome.headerColumn === "left");
      if (headerHitsColumn) height -= chrome.headerHeight;
      if (chrome.photoColumn === column) height -= chrome.photoHeight;
    }
    return height;
  };

  const pages: PageModel[] = ready
    ? trimEmptyPages(distribute(measured, { contentHeight: usable, heightFor }))
    : [];

  const total = pages.length || 1;
  useEffect(() => {
    onPageCount?.(total);
  }, [total, onPageCount]);

  const nodeById = new Map(doc.sections.map((s) => [s.id, s]));

  const documentStyle = {
    ...fontStyle(doc.theme.fonts.body),
    fontSize: fontSizeAt(doc.theme, 0),
    color: doc.theme.colors.text,
    // Read by bullet lists, which sit too deep to receive the theme.
    "--rc-bullet-gap": `${2 * spacingOf(doc.theme).bullet}px`,
  } as React.CSSProperties;

  const body = (
    <>
      {/* Measure layer: laid out exactly like a page, but never shown. */}
      <div
        aria-hidden
        data-measure-layer
        className="absolute pointer-events-none opacity-0"
        style={{
          top: 0,
          left: 0,
          width: dims.width,
          height: 0,
          overflow: "hidden",
          contain: "size layout",
        }}
      >
        <div ref={layerRef} style={documentStyle}>
          <PageCanvas doc={doc} renderSection={(node) => renderSection(node)} />
        </div>
      </div>

      {(pages.length ? pages : [null]).map((page, index) => {
        const content = (
          <div
            data-page={index}
            className="bg-white relative flex flex-col"
            style={{
              ...documentStyle,
              width: dims.width,
              height: dims.height,
              overflow: "hidden",
            }}
          >
            <PageCanvas
              doc={doc}
              pageIndex={index}
              dropZones={!!page}
              onBackgroundClick={setActivePath}
              renderSection={(node) => {
                if (!page) return renderSection(node);
                const key = effectiveColumn(doc, node) as ColumnKey;
                const slots = page.columns[key].slots.filter(
                  (s) => s.sectionId === node.id,
                );
                if (!slots.length) return null;
                return slots.map((slot) =>
                  renderSection(
                    node,
                    [slot.itemStart, slot.itemEnd],
                    slot.continued,
                  ),
                );
              }}
              columnFooter={
                columnFooter && page
                  ? (col) =>
                      columnFooter(
                        col as ColumnKey,
                        index,
                        page.columns[col as ColumnKey].free,
                        page.columns[col as ColumnKey].slots.length,
                      )
                  : undefined
              }
            />
          </div>
        );
        return (
          <div
            key={index}
            data-print-passthrough
            className={index < total - 1 ? "mb-12" : undefined}
          >
            {total > 1 && (
              <div
                data-editor-only
                className="mb-1.5 flex items-center gap-2 select-none"
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  Page {index + 1}
                </span>
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] text-muted-foreground/70">
                  {index + 1} / {total}
                </span>
              </div>
            )}
            {pageWrapper ? pageWrapper(content, index, total) : content}
          </div>
        );
      })}
    </>
  );

  // Sections the paginator has no measurement for yet would flash unpaginated;
  // keeping the wrapper relative anchors the hidden layer.
  void nodeById;
  const pageCss = `@page { size: ${dims.width}px ${dims.height}px; margin: 0; }`;

  return (
    <div className="relative" data-print-passthrough>
      <style>{pageCss}</style>
      {body}
    </div>
  );
}
