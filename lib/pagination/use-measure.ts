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

    layer.querySelectorAll<HTMLElement>("[data-section-id]").forEach((el) => {
      const id = el.dataset.sectionId!;
      const node = nodeById.get(id);
      if (!node) return;

      const styles = getComputedStyle(el);
      const trailing = parseFloat(styles.paddingBottom) || 0;

      // Fractional heights matter: offsetHeight rounds to whole pixels, and
      // rounding *down* on every item makes the paginator believe more fits
      // than really does, which shows up as a clipped last line.
      const headingEl = el.querySelector<HTMLElement>("[data-section-heading]");
      const headingHeight = headingEl
        ? headingEl.getBoundingClientRect().height +
          (parseFloat(getComputedStyle(headingEl).marginBottom) || 0)
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
        el.getBoundingClientRect().height - headingHeight - trailing,
      );

      const items =
        itemEls.length && stacked
          ? itemEls.map((item, i) => ({
              height:
                item.getBoundingClientRect().height +
                (parseFloat(getComputedStyle(item).marginBottom) || 0),
              gap: i < itemEls.length - 1 ? gap : 0,
            }))
          : // Summary (no item chrome) and any side-by-side flow.
            [{ height: blockHeight, gap: 0 }];

      next.push({
        id,
        column: effectiveColumn(doc, node),
        order: node.placement.order,
        headingHeight,
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
      columnPadding[id] =
        (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    });

    const nextChrome: PageChrome = {
      headerHeight: headerEl
        ? headerEl.getBoundingClientRect().height +
          (parseFloat(getComputedStyle(headerEl).marginBottom) || 0)
        : 0,
      headerColumn: doc.layout.header.placement,
      photoHeight: photoEl
        ? photoEl.getBoundingClientRect().height +
          (parseFloat(getComputedStyle(photoEl).marginBottom) || 0)
        : 0,
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
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) schedule();
    });
    return () => {
      cancelled = true;
    };
  }, [schedule]);

  return { measured, chrome, ready };
}
