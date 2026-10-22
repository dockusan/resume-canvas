/**
 * Page composition.
 *
 * Pure and deterministic: measured heights in, a page model out. Keeping it
 * free of DOM access is what makes the orphan/keep-together/pinning rules
 * testable, and it is the piece that lets the app answer "how much room is
 * left in this column" — which drives both the add-section affordance and the
 * move-to-page controls.
 */

import { Placement } from "@/lib/schema/document";

export interface MeasuredItem {
  /** The item's own height, without the flow gap that follows it. */
  height: number;
  /** Gap rendered *between* this item and the next one. */
  gap: number;
}

export interface MeasuredSection {
  id: string;
  column: Placement;
  order: number;
  /** Height of the heading block including its bottom margin. */
  headingHeight: number;
  /**
   * What the section's own box adds around its heading and items: top
   * padding and borders. Every fragment draws its own box, so this is
   * charged on each page the section lands on.
   */
  frame: number;
  /** Space below the section (container bottom padding). */
  trailing: number;
  items: MeasuredItem[];
  /**
   * How many real items the renderer must draw. Differs from `items.length`
   * for sections measured as one indivisible block (wrapped chips, grids),
   * where the height model has a single entry but the section still renders
   * every item.
   */
  renderCount: number;
  keepTogether: boolean;
  breakBefore: boolean;
  repeatHeading: boolean;
  /** Pinned page index, or "auto" to flow. */
  page: number | "auto";
}

export interface Slot {
  sectionId: string;
  /** Half-open item range rendered in this slot. */
  itemStart: number;
  itemEnd: number;
  /** True when this slot continues a section started on an earlier page. */
  continued: boolean;
  height: number;
}

export type ColumnKey = "left" | "right" | "full";

export interface PageColumn {
  slots: Slot[];
  used: number;
  free: number;
}

export interface PageModel {
  index: number;
  columns: Record<ColumnKey, PageColumn>;
}

export interface DistributeOptions {
  /** Usable height of one column on one page. */
  contentHeight: number;
  /**
   * Overrides `contentHeight` for a given column on a given page — page one
   * is shorter wherever the header or a pinned portrait sits.
   */
  heightFor?: (column: ColumnKey, pageIndex: number) => number;
  /**
   * A section is never left with its heading alone at the foot of a page:
   * the heading plus this many items must fit, or the whole thing moves on.
   */
  minItemsWithHeading?: number;
  /** Hard cap so a measurement bug can't spin forever. */
  maxPages?: number;
}

const emptyColumn = (contentHeight: number): PageColumn => ({
  slots: [],
  used: 0,
  free: contentHeight,
});

/**
 * Flow sections down their column, opening pages as needed.
 *
 * Columns are independent: a tall left column does not push the right column
 * down, which is what makes two-column resumes behave the way people expect.
 */
export function distribute(
  sections: MeasuredSection[],
  {
    contentHeight,
    heightFor,
    minItemsWithHeading = 1,
    maxPages = 50,
  }: DistributeOptions,
): PageModel[] {
  const available = (column: ColumnKey, pageIndex: number) =>
    Math.max(1, heightFor ? heightFor(column, pageIndex) : contentHeight);

  const makePage = (index: number): PageModel => ({
    index,
    columns: {
      left: emptyColumn(available("left", index)),
      right: emptyColumn(available("right", index)),
      full: emptyColumn(available("full", index)),
    },
  });

  const pages: PageModel[] = [makePage(0)];

  const pageAt = (index: number): PageModel => {
    while (pages.length <= index && pages.length < maxPages) {
      pages.push(makePage(pages.length));
    }
    return pages[Math.min(index, pages.length - 1)];
  };

  const byColumn = new Map<ColumnKey, MeasuredSection[]>();
  for (const section of sections) {
    const key = section.column as ColumnKey;
    if (!byColumn.has(key)) byColumn.set(key, []);
    byColumn.get(key)!.push(section);
  }

  for (const [column, list] of byColumn) {
    const ordered = [...list].sort((a, b) => a.order - b.order);
    let cursor = 0;

    for (const section of ordered) {
      if (section.page !== "auto") cursor = Math.max(0, section.page);
      else if (section.breakBefore && pageAt(cursor).columns[column].used > 0) {
        cursor += 1;
      }

      const total =
        section.headingHeight +
        section.frame +
        sumItems(section, 0, section.items.length) +
        section.trailing;

      // Keep-together and page-taller-than-a-page are different problems: the
      // first moves the section, the second has nowhere to move it to.
      if (section.keepTogether && total > available(column, cursor)) {
        placeWhole(column, cursor, section, total);
        continue;
      }

      if (section.keepTogether) {
        if (pageAt(cursor).columns[column].free < total) cursor += 1;
        placeWhole(column, cursor, section, total);
        continue;
      }

      let itemIndex = 0;
      let continued = false;

      while (itemIndex < section.items.length || itemIndex === 0) {
        const page = pageAt(cursor);
        const col = page.columns[column];
        const headingHeight =
          continued && !section.repeatHeading ? 0 : section.headingHeight;

        // How many items fit after the heading? The gap belongs *between*
        // items, so the last one on a page is not charged for it — otherwise
        // every page loses a gap's worth of room and breaks early.
        let fitted = 0;
        let height = headingHeight + section.frame;
        for (let i = itemIndex; i < section.items.length; i++) {
          const lead = fitted > 0 ? section.items[i - 1].gap : 0;
          const next = height + lead + section.items[i].height;
          if (next > col.free) break;
          height = next;
          fitted++;
        }

        const remaining = section.items.length - itemIndex;
        const isLastChunk = fitted === remaining;

        // Widow rule: a heading must not sit alone at the foot of a page.
        const strandedHeading =
          !continued &&
          remaining > 0 &&
          fitted < Math.min(minItemsWithHeading, remaining);

        if ((fitted === 0 && remaining > 0) || strandedHeading) {
          if (col.used === 0) {
            // Nothing else on the page and it still doesn't fit — place at
            // least one item rather than loop forever.
            const forced = Math.max(1, fitted);
            pushSlot(
              col,
              section,
              itemIndex,
              itemIndex + forced,
              continued,
              headingHeight +
                section.frame +
                sumItems(section, itemIndex, itemIndex + forced) +
                (itemIndex + forced >= section.items.length
                  ? section.trailing
                  : 0),
            );
            itemIndex += forced;
            continued = true;
            if (itemIndex >= section.items.length) break;
          }
          cursor += 1;
          if (cursor >= maxPages) break;
          continue;
        }

        const slotHeight =
          headingHeight +
          section.frame +
          sumItems(section, itemIndex, itemIndex + fitted) +
          (isLastChunk ? section.trailing : 0);
        pushSlot(
          col,
          section,
          itemIndex,
          itemIndex + fitted,
          continued,
          slotHeight,
        );
        itemIndex += fitted;
        continued = true;

        if (itemIndex >= section.items.length) break;
        cursor += 1;
        if (cursor >= maxPages) break;
      }
    }
  }

  return pages;

  function sumItems(section: MeasuredSection, from: number, to: number) {
    let sum = 0;
    for (let i = from; i < to; i++) {
      if (i > from) sum += section.items[i - 1].gap;
      sum += section.items[i].height;
    }
    return sum;
  }

  function placeWhole(
    column: ColumnKey,
    cursor: number,
    section: MeasuredSection,
    total: number,
  ) {
    const col = pageAt(cursor).columns[column];
    pushSlot(col, section, 0, section.items.length, false, total);
  }

  function pushSlot(
    col: PageColumn,
    section: MeasuredSection,
    start: number,
    end: number,
    continued: boolean,
    height: number,
  ) {
    const capacity = col.used + col.free;
    // An indivisible section models its height as one entry but must still
    // render all of its items, so translate the range back.
    const atomic = section.renderCount !== section.items.length;
    col.slots.push({
      sectionId: section.id,
      itemStart: atomic ? 0 : start,
      itemEnd: atomic ? section.renderCount : end,
      continued,
      height,
    });
    col.used += height;
    col.free = Math.max(0, capacity - col.used);
  }
}

/** Pages that carry no content in any column, used to trim trailing blanks. */
export function isPageEmpty(page: PageModel): boolean {
  return (["left", "right", "full"] as ColumnKey[]).every(
    (c) => page.columns[c].slots.length === 0,
  );
}

export function trimEmptyPages(pages: PageModel[]): PageModel[] {
  let last = pages.length - 1;
  while (last > 0 && isPageEmpty(pages[last])) last--;
  return pages.slice(0, last + 1);
}
