"use client";

import { useMemo } from "react";
import { useResumeStore } from "@/lib/store/useResumeStore";
import { ResumeDocument, SectionNode } from "./document";
import { reconcileSections } from "./migrate";

/**
 * The single read path for the presentation schema.
 *
 * Joins the raw document with the column arrays, which still own section
 * existence and order, so no component ever sees the two out of sync.
 */
export function useDocument(): ResumeDocument {
  const document = useResumeStore((s) => s.document);
  const leftColumn = useResumeStore((s) => s.settings.leftColumn);
  const rightColumn = useResumeStore((s) => s.settings.rightColumn);

  return useMemo(
    () => reconcileSections(document, { leftColumn, rightColumn } as never),
    [document, leftColumn, rightColumn],
  );
}

/**
 * Where a section actually renders.
 *
 * Stored placement survives switching between one and two columns — a section
 * parked in the right column keeps that assignment while the document is
 * single-column, and returns to it when the second column comes back — so the
 * projection happens here rather than by rewriting placement.
 */
export function effectiveColumn(
  doc: ResumeDocument,
  node: SectionNode,
): "left" | "right" | "full" {
  if (doc.layout.columns === 1) return "full";
  return node.placement.column === "full" ? "left" : node.placement.column;
}

/** Visible sections rendered in one column, in order. */
export function sectionsIn(
  doc: ResumeDocument,
  column: "left" | "right" | "full",
): SectionNode[] {
  return doc.sections
    .filter((s) => s.visible && effectiveColumn(doc, s) === column)
    .sort((a, b) => a.placement.order - b.placement.order);
}

export function useSectionNode(sectionId: string): SectionNode | undefined {
  const doc = useDocument();
  return doc.sections.find((s) => s.id === sectionId);
}
