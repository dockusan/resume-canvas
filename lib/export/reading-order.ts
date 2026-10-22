import { ResumeDocument, SectionNode } from "@/lib/schema/document";

/**
 * Visible sections in the order a single-column reader should meet them:
 * the main column first, then the sidebar.
 *
 * The main column is the wider one, which is not always the left: Banner,
 * Duotone and the other sidebar-left templates put the narrow column first.
 * Reading "left, then right" there would lead the plain-text and Word copies
 * with Strengths and Languages, and bury the Summary and Experience a
 * recruiter (or a parser) looks for first.
 */
export function readingOrder(doc: ResumeDocument): SectionNode[] {
  const mainIsLeft = doc.layout.columns === 1 || doc.layout.ratio >= 0.5;
  const rank = {
    full: 0,
    left: mainIsLeft ? 0 : 1,
    right: mainIsLeft ? 1 : 0,
  } as const;
  return doc.sections
    .filter((s) => s.visible)
    .sort(
      (a, b) =>
        rank[a.placement.column] - rank[b.placement.column] ||
        a.placement.order - b.placement.order,
    );
}
