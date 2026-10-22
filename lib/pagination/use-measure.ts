"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ResumeDocument } from "@/lib/schema/document";
import { effectiveColumn } from "@/lib/schema/use-document";
import { MeasuredSection } from "./distribute";

/**
 * Reads section and item heights out of an off-screen render of the document.
 *
 * Heights are measured at the exact column width each section will occupy, so
 * the numbers the distributor sees are the numbers the page will produce.
 * Measurement is debounced and re-runs on any content or style change.
 */
/**
 * Space consumed by page furniture rather than sections: the header band, the
 * portrait when it is pinned to a column, and each column's own padding. The
 * distributor has to subtract these or page one silently over-fills.
 */
export interface PageChrome {
  /** Header height, keyed by the column it occupies ("band" covers both). */
  headerHeight: number;
  headerColumn: "band" | "left" | "right";
  photoHeight: number;
  photoColumn: "header" | "left" | "right";
  columnPadding: Record<"left" | "right", number>;
}

const EMPTY_CHROME: PageChrome = {
  headerHeight: 0,
  headerColumn: "band",
  photoHeight: 0,
  photoColumn: "header",
  columnPadding: { left: 0, right: 0 },
};

export function useMeasuredSections(
  layerRef: React.RefObject<HTMLElement | null>,
  doc: ResumeDocument,
  { debounceMs = 120 }: { debounceMs?: number } = {},
): { measured: MeasuredSection[]; chrome: PageChrome; ready: boolean } {
  const [measured, setMeasured] = useState<MeasuredSection[]>([]);
  const [chrome, setChrome] = useState<PageChrome>(EMPTY_CHROME);
  const [ready, setReady] = useState(false);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const nodeById = new Map(doc.sections.map((s) => [s.id, s]));
    const next: MeasuredSection[] = [];

    // The layer lives inside the zoomed sheet, so getBoundingClientRect()
    // reports *scaled* pixels while page heights, paddings and margins are in
    // unscaled document pixels. Dividing by the live zoom keeps every number
    // in one unit; without it, zooming out over-filled each page and the PDF
    // inherited whatever split happened to be on screen.
    const zoom =
      layer.offsetWidth > 0
        ? layer.getBoundingClientRect().width / layer.offsetWidth
        : 1;
    const height = (target: Element) =>
      target.getBoundingClientRect().height / (zoom || 1);
    const margins = (target: Element) => {
      const cs = getComputedStyle(target);
      return (
        (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0)
      );
    };

    layer.querySelectorAll<HTMLElement>("[data-section-id]").forEach((el) => {
      const id = el.dataset.sectionId!;
      const node = nodeById.get(id);
      if (!node) return;

      const styles = getComputedStyle(el);
      // An outlined card keeps its gap to the next section as a margin,
      // which the box's own height doesn't include.
      const marginBelow = parseFloat(styles.marginBottom) || 0;
      const trailing = (parseFloat(styles.paddingBottom) || 0) + marginBelow;

      // Fractional heights matter: offsetHeight rounds to whole pixels, and
      // rounding *down* on every item makes the paginator believe more fits
      // than really does, which shows up as a clipped last line.
      const headingEl = el.querySelector<HTMLElement>("[data-section-heading]");
      const headingHeight = headingEl
        ? height(headingEl) + margins(headingEl)
        : 0;

      const itemEls = Array.from(
        el.querySelectorAll<HTMLElement>("[data-item-index]"),
      ).filter((item) => item.closest("[data-section-id]") === el);

      // Flex/grid gaps sit between items rather than on them, so fold the gap
      // into every item but the last.
      const flow = itemEls[0]?.parentElement;
      const flowStyle = flow ? getComputedStyle(flow) : null;
      const gap = flowStyle ? parseFloat(flowStyle.rowGap) || 0 : 0;

      /**
       * Only a vertical stack can be split item by item. When items sit side
       * by side — wrapped skill chips, a grid — summing their heights wildly
       * overstates the section (ten chips on three rows measured as ten rows),
       * which pushes it to the next page and leaves the current one half
       * empty. Those sections are measured as one indivisible block instead.
       */
      const stacked =
        !flowStyle ||
        (flowStyle.display !== "grid" && flowStyle.flexDirection === "column");

      const blockHeight = Math.max(
        0,
        height(el) + marginBelow - headingHeight - trailing,
      );

      const items =
        itemEls.length && stacked
          ? itemEls.map((item, i) => ({
              // Line separators put their spacing in marginTop, so both
              // margins count or each divided item is under-measured.
              height: height(item) + margins(item),
              gap: i < itemEls.length - 1 ? gap : 0,
            }))
          : // Summary (no item chrome) and any side-by-side flow.
            [{ height: blockHeight, gap: 0 }];

      // Whatever the block holds beyond its items is the box itself: top
      // padding and borders. A single-block section already counts it.
      const itemsHeight = items.reduce(
        (sum, it) => sum + it.height + it.gap,
        0,
      );
      const frame = Math.max(0, blockHeight - itemsHeight);

      next.push({
        id,
        column: effectiveColumn(doc, node),
        order: node.placement.order,
        headingHeight,
        frame,
        trailing,
        items,
        renderCount: itemEls.length || items.length,
        keepTogether: node.flow.keepTogether,
        breakBefore: node.flow.breakBefore,
        repeatHeading: node.flow.repeatHeading,
        page: node.placement.page,
      });
    });

    const headerEl = layer.querySelector<HTMLElement>("[data-resume-header]");
    const photoEl = layer.querySelector<HTMLElement>("[data-photo-slot]");
    const columnPadding = { left: 0, right: 0 };
    layer.querySelectorAll<HTMLElement>("[data-column]").forEach((el) => {
      const id = el.dataset.column as "left" | "right";
      const cs = getComputedStyle(el);
      // Bleed padding is cancelled by an equal negative margin (see
      // PageCanvas), so it takes no room from the content.
      columnPadding[id] =
        (parseFloat(cs.paddingTop) || 0) +
        (parseFloat(cs.paddingBottom) || 0) -
        (parseFloat(el.dataset.bleedY ?? "") || 0);
    });

    const nextChrome: PageChrome = {
      headerHeight: headerEl ? height(headerEl) + margins(headerEl) : 0,
      headerColumn: doc.layout.header.placement,
      photoHeight: photoEl ? height(photoEl) + margins(photoEl) : 0,
      photoColumn: doc.layout.header.photo.slot,
      columnPadding,
    };

    setMeasured((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
    );
    setChrome((prev) =>
      JSON.stringify(prev) === JSON.stringify(nextChrome) ? prev : nextChrome,
    );
    setReady(true);
  }, [doc, layerRef]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    }, debounceMs);
  }, [measure, debounceMs]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(layer);
    layer
      .querySelectorAll<HTMLElement>("[data-section-id]")
      .forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      if (timer.current) clearTimeout(timer.current);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [schedule, layerRef, doc]);

  // Webfonts change every height; re-measure once they land.
  //
  // `fonts.ready` alone is not enough for a font the user picks mid-session:
  // the face is only requested during the next layout, so at the moment this
  // effect re-runs the promise can already be resolved, and the document would
  // be paginated against the fallback metrics and never corrected. The event
  // fires whenever a load actually completes, which is the signal that matters.
  useEffect(() => {
    let cancelled = false;
    const fonts = document.fonts;
    if (!fonts) return;
    const onDone = () => {
      if (!cancelled) schedule();
    };
    fonts.ready.then(onDone);
    fonts.addEventListener("loadingdone", onDone);
    return () => {
      cancelled = true;
      fonts.removeEventListener("loadingdone", onDone);
    };
  }, [schedule]);

  return { measured, chrome, ready };
}

/**
 * Prepare the document for printing and resolve once it has re-paginated.
 *
 * On screen the measure layer includes editor-only furniture ("Add point"
 * rows, empty-field placeholders, "add item" buttons), so page breaks leave
 * room for things the PDF never shows. The `rc-printing` class hides that
 * furniture inside the measure layer; the resize it causes re-runs the
 * paginator, and we wait for that (and for webfonts) before the dialog opens.
 * Call `endPrintLayout()` once printing is done.
 */
export async function settleLayout(): Promise<void> {
  document.documentElement.classList.add("rc-printing");
  await document.fonts?.ready;
  await new Promise((resolve) => setTimeout(resolve, 450));
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

export function endPrintLayout(): void {
  document.documentElement.classList.remove("rc-printing");
}
